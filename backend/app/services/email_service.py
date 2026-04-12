"""SportShield AI — Email notification service via SendGrid."""

from app.core.config import settings


def send_violation_email(to_email: str, violation, asset, org) -> bool:
    """Send a violation alert email via SendGrid.

    Args:
        to_email: Recipient email address.
        violation: Violation model instance.
        asset: MediaAsset model instance.
        org: Organization model instance.

    Returns:
        True if sent successfully, False otherwise.
    """
    if not settings.SENDGRID_API_KEY:
        print("SendGrid API key not configured, skipping email")
        return False

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, HtmlContent

        severity_colors = {
            "high": "#DC2626",
            "medium": "#D97706",
            "low": "#2563EB",
        }

        severity_color = severity_colors.get(violation.severity, "#6B7280")
        org_name = org.name if org else "Your Organization"
        asset_name = asset.name if asset else "Unknown Asset"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 0; background: #f8fafc; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
                .header {{ background: linear-gradient(135deg, #1A3C6E, #0D2040); color: white; padding: 32px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .header p {{ margin: 8px 0 0; opacity: 0.8; font-size: 14px; }}
                .severity-badge {{ display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; color: white; background: {severity_color}; text-transform: uppercase; }}
                .content {{ padding: 32px; }}
                .metric {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }}
                .metric-label {{ color: #64748b; font-size: 14px; }}
                .metric-value {{ font-weight: 600; color: #1e293b; font-size: 14px; }}
                .cta {{ display: block; width: 100%; text-align: center; padding: 14px; background: #E8501A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }}
                .footer {{ padding: 24px 32px; background: #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ SportShield AI</h1>
                    <p>IP Violation Alert</p>
                </div>
                <div class="content">
                    <p style="text-align: center;">
                        <span class="severity-badge">{violation.severity.upper()} SEVERITY</span>
                    </p>
                    <h2 style="color: #1e293b; text-align: center; margin: 16px 0;">New Violation Detected</h2>
                    <p style="color: #64748b; text-align: center;">
                        A potential unauthorized use of your media has been detected.
                    </p>

                    <div style="margin-top: 24px;">
                        <div class="metric">
                            <span class="metric-label">Asset</span>
                            <span class="metric-value">{asset_name}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Organization</span>
                            <span class="metric-value">{org_name}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Confidence Score</span>
                            <span class="metric-value">{violation.confidence_score:.1f}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Platform</span>
                            <span class="metric-value">{violation.platform.title()}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Detected URL</span>
                            <span class="metric-value" style="word-break: break-all; max-width: 300px;">
                                {violation.detected_url[:80]}{'...' if len(violation.detected_url) > 80 else ''}
                            </span>
                        </div>
                    </div>

                    <a href="http://localhost:5173/violations/{violation.id}" class="cta">
                        View Violation Details →
                    </a>
                </div>
                <div class="footer">
                    <p>SportShield AI — Protecting Your Sports Media IP</p>
                    <p>This is an automated alert. Do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        message = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=f"[SportShield] {violation.severity.upper()} Severity Violation — {asset_name}",
            html_content=html_content,
        )

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code in (200, 201, 202)

    except Exception as e:
        print(f"SendGrid email error: {e}")
        return False
