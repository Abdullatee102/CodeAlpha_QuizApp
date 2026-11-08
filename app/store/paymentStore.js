import { create } from 'zustand';
import api from '../data/api';
import formatAxiosError from '../data/formatError';

export const usePaymentStore = create((set, get) => ({
  products: [],
  activeEntitlements: [],
  entitlementHistory: [],
  orders: [],
  isLoadingProducts: false,
  isLoadingEntitlements: false,
  isLoadingOrders: false,
  isProcessingPayment: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchProducts: async () => {
    set({ isLoadingProducts: true, error: null });
    try {
      const res = await api.get('/payments/products');
      const products = res.data?.data?.products || [];
      set({ products, isLoadingProducts: false });
      return products;
    } catch (err) {
      const formatted = formatAxiosError(err);
      set({ error: formatted.message, isLoadingProducts: false });
      return [];
    }
  },

  fetchActiveEntitlements: async () => {
    set({ isLoadingEntitlements: true, error: null });
    try {
      const res = await api.get('/payments/entitlements');
      const activeEntitlements = res.data?.data?.entitlements || [];
      set({ activeEntitlements, isLoadingEntitlements: false });
      return activeEntitlements;
    } catch (err) {
      const formatted = formatAxiosError(err);
      set({ error: formatted.message, isLoadingEntitlements: false });
      return [];
    }
  },

  fetchEntitlementHistory: async () => {
    try {
      const res = await api.get('/payments/entitlements/history');
      const history = res.data?.data?.history || [];
      set({ entitlementHistory: history });
      return history;
    } catch (err) {
      console.warn('[PaymentStore] Failed to fetch history:', err.message);
      return [];
    }
  },

  fetchOrders: async () => {
    set({ isLoadingOrders: true });
    try {
      const res = await api.get('/payments/orders');
      const orders = res.data?.data?.orders || [];
      set({ orders, isLoadingOrders: false });
      return orders;
    } catch (err) {
      console.warn('[PaymentStore] Failed to fetch orders:', err.message);
      set({ isLoadingOrders: false });
      return [];
    }
  },

  checkFeatureAccess: async (featureKey) => {
    try {
      const res = await api.get(`/payments/entitlements/check/${featureKey}`);
      return res.data?.data?.hasAccess || false;
    } catch {
      return false;
    }
  },

  initializePayment: async (productId) => {
    set({ isProcessingPayment: true, error: null });
    try {
      const res = await api.post('/payments/initialize', { productId });
      const data = res.data?.data;
      set({ isProcessingPayment: false });
      return {
        success: true,
        order: data?.order,
        authorizationUrl: data?.authorizationUrl,
        reference: data?.order?.orderReference,
      };
    } catch (err) {
      const formatted = formatAxiosError(err);
      set({ error: formatted.message, isProcessingPayment: false });
      return {
        success: false,
        error: formatted.message,
      };
    }
  },

  verifyPayment: async (reference) => {
    set({ isProcessingPayment: true, error: null });
    try {
      const res = await api.post(`/payments/verify/${reference}`);
      const data = res.data?.data;
      
      // Refresh user's entitlements and orders after verification
      await get().fetchActiveEntitlements();
      await get().fetchOrders();

      set({ isProcessingPayment: false });
      return {
        success: true,
        order: data?.order,
        entitlement: data?.entitlement,
      };
    } catch (err) {
      const formatted = formatAxiosError(err);
      set({ error: formatted.message, isProcessingPayment: false });
      return {
        success: false,
        error: formatted.message,
      };
    }
  },
}));
