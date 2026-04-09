using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.SignUpServices;
using Hobbyist.Api.Services.ReccommendationServices.OnboardingServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers.AuthControllers
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController(
        ISignUpService signUpService,
        IOnboardingService onboardingService
    ) : ControllerBase
    {
        [HttpPost("start")]
        public async Task<ActionResult<OtpResponse>> StartSignUp(
            [FromBody] StartSignUpRequest request,
            CancellationToken ct
        )
        {
            var result = await signUpService.StartSignUpAsync(request, ct);
            return result.ToActionResult();
        }

        [HttpPost("verify-otp")]
        public async Task<ActionResult<VerifyOtpResponse>> VerifySignUpOtp(
            [FromBody] VerifyOtpRequest request,
            CancellationToken ct
        )
        {
            var result = signUpService.VerifyOtp(request);
            if (!result.IsSuccess)
            {
                return Result<VerifyOtpResponse>.FromError(result).ToActionResult();
            }

            var popularInterests = await onboardingService.GetPopularInterestsAsync(ct);

            return new VerifyOtpResponse { PopularInterests = popularInterests };
        }

        [HttpPost("resend-otp")]
        public async Task<ActionResult<OtpResponse>> ResendOtp(
            [FromBody] ResendOtpRequest request,
            CancellationToken ct
        )
        {
            var result = await signUpService.ResendOtpAsync(request, ct);
            return result.ToActionResult();
        }

        [HttpPost("complete")]
        public async Task<ActionResult<AuthResult>> CompleteSignUp(
            [FromBody] CompleteSignUpRequest request,
            CancellationToken ct
        )
        {
            var result = await signUpService.CompleteSignUpAsync(request, ct);
            if (!result.IsSuccess)
            {
                return Result<AuthResult>.FromError(result).ToActionResult();
            }

            var device = Request.GetPlatform();
            if (device.Equals("mobile"))
            {
                return Ok(result.Content);
            }

            HttpContext.SetAuthCookies(result.Content!);
            return NoContent();
        }
    }
}
