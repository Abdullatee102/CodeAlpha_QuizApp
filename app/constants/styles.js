import { StyleSheet } from 'react-native';

export const GlobalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 32,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  subtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 16,
    lineHeight: 22,
  },

  inputField: {
    padding: 18,
    borderRadius: 15,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
  },

  primaryBtn: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  btnText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});