using Hobbyist.Common;

namespace Hobbyist.Api.Services.EmailServices;

public interface IEmailService
{
    public Task<Result> SendEmailAsync(
        string to,
        string subject,
        string body,
        CancellationToken ct
    );
    public Task<Result> SendOtpEmailAsync(
        string to,
        string otp,
        string otpValidFor,
        CancellationToken ct
    );
}
