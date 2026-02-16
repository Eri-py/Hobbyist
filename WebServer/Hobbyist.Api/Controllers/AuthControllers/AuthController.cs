using Hobbyist.Api.Dtos.AuthDtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers.AuthControllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(ITokenService tokenService) : ControllerBase
    {
        [HttpGet("get-user-details")]
        [Authorize]
        public ActionResult<GetUserResponse> GetUserDetails()
        {
            var user = ApiHelper.GetUserDetails(User);
            return Ok(new GetUserResponse { IsAuthenticated = true, User = user });
        }

        [HttpGet("refresh-token")]
        public async Task<ActionResult<AuthResult>> RefreshTokenWeb()
        {
            var refreshToken = Request.Cookies["__Secure-refreshToken"];
            if (refreshToken is null)
            {
                return BadRequest(ErrorMessages.InvalidRefreshToken);
            }

            var result = await tokenService.VerifyRefreshTokenAsync(refreshToken);
            if (!result.IsSuccess)
            {
                return Result<AuthResult>.FromError(result).ToActionResult();
            }

            Helpers.SetAuthCookies(HttpContext, result.Content!);
            return NoContent();
        }

        [HttpPost("refresh-token-mobile")]
        public async Task<ActionResult<AuthResult>> RefreshTokenMobile(
            [FromBody] RefreshTokenRequest request
        )
        {
            var platform = ApiHelper.GetPlatform(Request);
            if (platform != "mobile")
            {
                return BadRequest(ErrorMessages.MobileOnlyEndpoint);
            }

            var result = await tokenService.VerifyRefreshTokenAsync(request.RefreshToken);
            if (!result.IsSuccess)
            {
                return Result<AuthResult>.FromError(result).ToActionResult();
            }

            return Ok(result.Content);
        }
    }
}
