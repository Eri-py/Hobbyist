using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.AuthSessionServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers.AuthControllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthSessionController(IAuthSessionService authService) : ControllerBase
    {
        [HttpGet("get-user-details")]
        [Authorize]
        public async Task<ActionResult<GetUserResponse>> GetUserDetails(CancellationToken ct)
        {
            var response = await authService.GetUserDetailsAsync(User, HttpContext, Request, ct);
            return Ok(response);
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<AuthResult>> RefreshToken(CancellationToken ct)
        {
            var result = await authService.RefreshTokenAsync(Request, ct);
            if (!result.IsSuccess)
            {
                return Result<AuthResult>.FromError(result).ToActionResult();
            }

            var platform = Request.GetPlatform();
            if (platform == "mobile")
            {
                return Ok(result.Content);
            }

            HttpContext.SetAuthCookies(result.Content!);
            return NoContent();
        }
    }
}
