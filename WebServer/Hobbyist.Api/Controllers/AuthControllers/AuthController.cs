using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers.AuthControllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(ITokenService tokenService) : ControllerBase
    {
        [HttpGet("get-user-details")]
        public ActionResult<GetUserResponse> GetUserDetails()
        {
            if (!User.Identity!.IsAuthenticated)
                return Unauthorized();

            var user = ApiHelper.GetUserDetails(User);
            return Ok(new GetUserResponse { IsAuthenticated = true, User = user });
        }

        [HttpGet("refresh-token")]
        public async Task<ActionResult<string>> RefreshToken()
        {
            var refreshToken = Request.Cookies["__Secure-refreshToken"];
            if (refreshToken is null)
            {
                return BadRequest("Invalid token");
            }

            var result = await tokenService.VerifyRefreshTokenAsync(refreshToken);
            if (!result.IsSuccess)
            {
                return Result<string>.FromError(result).ToActionResult();
            }

            Helpers.SetAuthCookies(HttpContext, result.Content!);
            return NoContent();
        }
    }
}
