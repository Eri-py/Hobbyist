using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.Auth.SignUpServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers.Auth
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController(ISignUpService signUpService) : ControllerBase
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
        public ActionResult<VerifyOtpResponse> VerifySignUpOtp([FromBody] VerifyOtpRequest request)
        {
            var result = signUpService.VerifyOtp(request);
            if (!result.IsSuccess)
            {
                return Result<VerifyOtpResponse>.FromError(result).ToActionResult();
            }

            // TODO: Implement real popular interest calls
            return new VerifyOtpResponse
            {
                PopularInterests =
                [
                    "Trading Cards",
                    "Vinyl Records",
                    "Coins",
                    "Stamps",
                    "Comics",
                    "Figures",
                    "Ceramics",
                    "Art Prints",
                    "Vintage Toys",
                    "Watches",
                    "Jewellery",
                    "Books",
                    "Cameras",
                    "Video Games",
                    "Rare Plants",
                    "Minerals",
                    "Sneakers",
                    "Antique Maps",
                ],
            };
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
