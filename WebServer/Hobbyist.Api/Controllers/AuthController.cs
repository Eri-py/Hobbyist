using Hobbyist.Api.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        [HttpGet("get-user-details")]
        public ActionResult<GetUserResponse> GetUserDetails()
        {
            if (!User.Identity!.IsAuthenticated)
                return Unauthorized();

            var user = ApiHelper.GetUserDetails(User);
            return Ok(new GetUserResponse { IsAuthenticated = true, User = user });
        }
    }
}
