using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.SignUpServices;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController(ISignUpService signUpService) : ControllerBase
    {
        [HttpPost("start")]
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
        public async Task<ActionResult<OtpResponse>> ResendOtp(
            [FromBody] ResendOtpRequestSignUp request
        )
        {
            var result = await signUpService.ResendOtpAsync(request);
            return result.ToActionResult();
        }
    }
}
