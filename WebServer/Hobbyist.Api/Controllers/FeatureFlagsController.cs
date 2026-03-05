using System.Reflection;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;

namespace Hobbyist.Api.Controllers
{
    [Route("api/feature-flags")]
    [ApiController]
    public class FeatureFlagsController(IFeatureManager featureManager) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<FeatureFlagsResponse>> GetFeatureFlags()
        {
            var flagFields = typeof(FeatureFlags)
                .GetFields(BindingFlags.Public | BindingFlags.Static)
                .Where(f => f.IsLiteral && f.FieldType == typeof(string));

            var flags = new Dictionary<string, bool>();

            foreach (var field in flagFields)
            {
                var flagName = (string)field.GetRawConstantValue()!;
                flags[flagName] = await featureManager.IsEnabledAsync(flagName);
            }

            return Ok(new FeatureFlagsResponse { Flags = flags });
        }
    }
}
