using Hobbyist.Common;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Hobbyist.Api.Services.EmailServices;

public class ResendEmailService(IConfiguration configuration) : IEmailService
{
    public async Task<Result> SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(
                new MailboxAddress(
                    configuration["Resend:FromName"]!,
                    configuration["Resend:FromAddress"]!
                )
            );
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = body };
            message.Body = bodyBuilder.ToMessageBody();

            Console.WriteLine(message.From);
            Console.WriteLine(message.To);

            using var client = new SmtpClient();
            await client.ConnectAsync("smtp.resend.com", 2465, SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync("resend", configuration["Resend:ApiKey"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            return Result.NoContent();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return Result.InternalServerError("An unexpected error has occured");
        }
    }

    public async Task<Result> SendOtpEmailAsync(string to, string otp, string otpValidFor)
    {
        var templatePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Services",
            "EmailServices",
            "EmailTemplates",
            "VerificationEmailTemplate.html"
        );
        var htmlTemplate = await File.ReadAllTextAsync(templatePath);

        var htmlBody = htmlTemplate.Replace("{{Otp}}", otp).Replace("{{OtpValidFor}}", otpValidFor);

        return await SendEmailAsync(to, "Verify Your Email Address", htmlBody);
    }
}
