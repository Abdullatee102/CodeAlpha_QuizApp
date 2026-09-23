export const quizReportHTML = ({
  categoryTitle,
  finalScore,
  percentage,
  correctCount,
  totalQuestions,
  profile,
  user,
}) => {
  const safeScore = Number(finalScore) || 0;
  const safePercentage =
    percentage !== undefined &&
    percentage !== null
      ? Number(percentage) || 0
      : totalQuestions > 0
        ? Number(
            (
              (safeScore /
                (totalQuestions * 10)) *
              100
            ).toFixed(2)
          )
        : 0;

  const maximumScore =
    Number(totalQuestions || 0) * 10;

  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #008F73;
            margin: 0;
            padding: 30px;
            color: #333;
          }

          .report-card {
            max-width: 600px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          }

          .header {
            background: #006b54;
            color: #FFFFFF;
            padding: 24px;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .content {
            padding: 30px;
          }

          .badge-container {
            text-align: center;
            margin-bottom: 24px;
          }

          .category-pill {
            display: inline-block;
            background: #E0F2FE;
            color: #0369A1;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 14px;
            border-radius: 20px;
            letter-spacing: 0.5px;
          }

          .score-box {
            text-align: center;
            background: #F8FAFC;
            border: 2px dashed #CBD5E1;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }

          .score-label {
            font-size: 15px;
            color: #64748B;
          }

          .score-value {
            font-size: 36px;
            font-weight: bold;
            color: #008F73;
            margin: 8px 0;
          }

          .percentage-value {
            font-size: 22px;
            font-weight: bold;
            color: #006b54;
            margin-top: 4px;
          }

          .score-sub {
            font-size: 15px;
            color: #64748B;
            margin-top: 8px;
          }

          .details-grid {
            background: #F1F5F9;
            border-radius: 10px;
            padding: 16px 20px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            border-bottom: 1px solid #E2E8F0;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            color: #64748B;
            font-weight: 500;
          }

          .detail-value {
            color: #0F172A;
            font-weight: bold;
          }

          .footer {
            text-align: center;
            font-size: 11px;
            color: #94A3B8;
            margin-top: 24px;
          }
        </style>
      </head>

      <body>
        <div class="report-card">

          <div class="header">
            <h1>BrainBuzz Official Report</h1>
          </div>

          <div class="content">

            <div class="badge-container">
              <span class="category-pill">
                ${categoryTitle || 'General Quiz'}
              </span>
            </div>

            <div class="score-box">

              <div class="score-label">
                Final Score
              </div>

              <div class="score-value">
                ${safeScore} / ${maximumScore} Points 🎉
              </div>

              <div class="percentage-value">
                ${safePercentage}%
              </div>

              <div class="score-sub">
                Correct Answers:
                <strong>
                  ${correctCount} / ${totalQuestions}
                </strong>
              </div>

            </div>

            <div class="details-grid">

              <div class="detail-row">
                <span class="detail-label">
                  Player Name
                </span>

                <span class="detail-value">
                  ${
                    profile?.fullName ||
                    user?.email ||
                    'Player'
                  }
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">
                  Date Attempted
                </span>

                <span class="detail-value">
                  ${new Date().toLocaleDateString(
                    undefined,
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </span>
              </div>

            </div>

            <div class="footer">
              Generated securely via BrainBuzz Mobile
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
};