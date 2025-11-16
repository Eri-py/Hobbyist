using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet("ping")]
        public ActionResult<string> Ping()
        {
            Console.WriteLine("ping successful");
            return Ok("Ping successful");
        }
    }
}
