from __future__ import annotations

import smtplib
from email.message import EmailMessage

from backend.core.config import settings
from backend.schemas.common import NoticeDeliveryStatus


class NoticeEmailService:
    def send_notice(
        self,
        recipient_email: str | None,
        dmca_notice: str,
        suspect_source_url: str | None = None,
    ) -> NoticeDeliveryStatus:
        if not recipient_email:
            return NoticeDeliveryStatus(
                requested=True,
                status="needs_recipient",
                message="A recipient email is required before an automatic copyright notice can be sent.",
                recipient_email=None,
            )

        if not settings.smtp_host or not settings.smtp_from_email:
            return NoticeDeliveryStatus(
                requested=True,
                status="smtp_not_configured",
                message="SMTP is not configured. Set SMTP_HOST and SMTP_FROM_EMAIL to enable automatic copyright emails.",
                recipient_email=recipient_email,
            )

        subject, body = self._split_notice(dmca_notice)
        if suspect_source_url:
            body = f"{body}\n\nReported source link: {suspect_source_url}"

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.smtp_from_email
        message["To"] = recipient_email
        message.set_content(body)

        try:
            if settings.smtp_use_ssl:
                with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                    self._authenticate(server)
                    server.send_message(message)
            else:
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                    if settings.smtp_use_tls:
                        server.starttls()
                    self._authenticate(server)
                    server.send_message(message)
        except Exception as exc:
            return NoticeDeliveryStatus(
                requested=True,
                status="failed",
                message=f"Automatic copyright notice failed to send: {exc}",
                recipient_email=recipient_email,
            )

        return NoticeDeliveryStatus(
            requested=True,
            status="sent",
            message=f"Automatic copyright notice sent to {recipient_email}.",
            recipient_email=recipient_email,
        )

    def skipped(self, reason: str, recipient_email: str | None = None, requested: bool = False) -> NoticeDeliveryStatus:
        return NoticeDeliveryStatus(
            requested=requested,
            status="skipped",
            message=reason,
            recipient_email=recipient_email,
        )

    def _authenticate(self, server: smtplib.SMTP) -> None:
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password or "")

    def _split_notice(self, dmca_notice: str) -> tuple[str, str]:
        lines = dmca_notice.splitlines()
        if lines and lines[0].startswith("Subject:"):
            subject = lines[0].split(":", 1)[1].strip()
            body = "\n".join(lines[1:]).strip()
            return subject, body
        return "SportsTrace AI Copyright Notice", dmca_notice.strip()
