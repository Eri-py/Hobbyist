using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.Auth.LoginServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController(ILoginService loginService) : ControllerBase
    {
        [HttpPost("start")]
        public async Task<ActionResult<StartLoginResponse>> StartLogin(
            [FromBody] StartLoginRequest request,
            CancellationToken ct
        )
        {
            var result = await loginService.StartLoginAsync(request, ct);
            return result.ToActionResult();
        }

        [HttpPost("resend-otp")]
        public async Task<ActionResult<OtpResponse>> ResendOtp(
            [FromBody] ResendOtpRequest request,
            CancellationToken ct
        )
        {
            var result = await loginService.ResendOtpAsync(request, ct);
            return result.ToActionResult();
        }

        [HttpPost("complete")]
        public async Task<ActionResult<AuthResult>> CompleteLogin(
            [FromBody] CompleteLoginRequest request,
            CancellationToken ct
        )
        {
            var result = await loginService.CompleteLoginAsync(request, ct);
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
