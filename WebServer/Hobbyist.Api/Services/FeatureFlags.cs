// AUTO-GENERATED — do not edit manually.
// Regenerate by running: pnpm generate-feature-flags
// Source of truth: WebServer/Hobbyist.Api/featureflags.json

namespace Hobbyist.Api.Services;

public static class FeatureFlags
{
    // Usage in a controller:  [FeatureGate(FeatureFlags.MyFeature)]
    // Usage in a service:     await featureManager.IsEnabledAsync(FeatureFlags.MyFeature)
    public const string Trade = "Trade";
    public const string Events = "Events";
    public const string Messages = "Messages";
    public const string Search = "Search";
    public const string Create = "Create";
    public const string OAuthButtons = "OAuthButtons";
    public const string RightSidebar = "RightSidebar";
    public const string Settings = "Settings";
}
