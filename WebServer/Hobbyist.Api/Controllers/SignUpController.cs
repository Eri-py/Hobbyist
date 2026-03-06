using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.SignUpServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Hobbyist.Api.Controllers
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController(ISignUpService signUpService) : ControllerBase
    {
        [HttpPost("start")]
        [EnableRateLimiting("otp")]
        public async Task<ActionResult<OtpResponse>> StartSignUp(
            [FromBody] StartSignUpRequest request
        )
        {
            var result = await signUpService.StartSignUpAsync(request);
            return result.ToActionResult();
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifySignUpOtp([FromBody] VerifyOtpRequest request)
        {
            var result = signUpService.VerifyOtp(request);
            return result.ToActionResult();
        }

        [HttpPost("resend-otp")]
        [EnableRateLimiting("otp")]
        public async Task<ActionResult<OtpResponse>> ResendOtp([FromBody] ResendOtpRequest request)
        {
            var result = await signUpService.ResendOtpAsync(request);
            return result.ToActionResult();
        }

        [HttpPost("complete")]
        public async Task<ActionResult<AuthResult>> CompleteSignUp(
            [FromBody] CompleteSignUpRequest request
        )
        {
            var result = await signUpService.CompleteSignUpAsync(request);
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
