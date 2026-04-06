using Hobbyist.Api.Extensions;
using Hobbyist.Common;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Hobbyist.Api.Services.EmailServices;

public class ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
    : IEmailService
{
    public async Task<Result> SendEmailAsync(
        string to,
        string subject,
        string body,
        CancellationToken ct
    )
    {
        var normalizedTo = to.Trim().ToLowerInvariant();

        try
        {
            var message = new MimeMessage();
            message.From.Add(
                new MailboxAddress(
                    configuration["Resend:FromName"]!,
                    configuration["Resend:FromAddress"]!
                )
            );
            message.To.Add(MailboxAddress.Parse(normalizedTo));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = body };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                "smtp.resend.com",
                2465,
                SecureSocketOptions.SslOnConnect,
                ct
            );
            await client.AuthenticateAsync("resend", configuration["Resend:ApiKey"], ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            return Result.NoContent();
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to send email to {To} with subject '{Subject}'",
                logger.Hash(normalizedTo),
                subject
            );
            return Result.InternalServerError("An unexpected error has occured");
        }
    }

    public async Task<Result> SendOtpEmailAsync(
        string to,
        string otp,
        string otpValidFor,
        CancellationToken ct
    )
    {
        var templatePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Services",
            "EmailServices",
            "EmailTemplates",
            "VerificationEmailTemplate.html"
        );
        var htmlTemplate = await File.ReadAllTextAsync(templatePath, ct);

        var htmlBody = htmlTemplate.Replace("{{Otp}}", otp).Replace("{{OtpValidFor}}", otpValidFor);

        return await SendEmailAsync(to, "Verify Your Email Address", htmlBody, ct);
    }
}
