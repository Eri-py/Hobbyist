using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.LoginServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController(ILoginService loginService) : ControllerBase
    {
        [HttpPost("start")]
        public async Task<ActionResult<StartLoginResponse>> StartLogin(
            [FromBody] StartLoginRequest request
        )
        {
            var result = await loginService.StartLoginAsync(request);
            return result.ToActionResult();
        }

        [HttpPost("resend-otp")]
        public async Task<ActionResult<OtpResponse>> ResendOtp([FromBody] ResendOtpRequest request)
        {
            var result = await loginService.ResendOtpAsync(request);
            return result.ToActionResult();
        }

        [HttpPost("complete")]
        public async Task<ActionResult<AuthResult>> CompleteLogin(
            [FromBody] CompleteLoginRequest request
        )
        {
            var result = await loginService.CompleteLoginAsync(request);
            if (!result.IsSuccess)
            {
                return Result<AuthResult>.FromError(result).ToActionResult();
            }

            HttpContext.SetAuthCookies(result.Content!);
            return NoContent();
        }
    }
}
