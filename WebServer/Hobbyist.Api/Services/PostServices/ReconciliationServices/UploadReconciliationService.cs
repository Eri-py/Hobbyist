namespace Hobbyist.Api.Services.PostServices.ReconciliationServices;

/// <summary>
/// Background worker that periodically rescues posts stuck in the Uploading state — publishing
/// those whose uploads actually landed and failing those that never completed.
/// </summary>
public class UploadReconciliationService(ILogger<UploadReconciliationService> logger)
    : BackgroundService
{
    // How long to wait between sweeps.
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(5);

    // The host calls this once at startup. It runs for the whole lifetime of the app; on shutdown
    // the host cancels `stoppingToken`, which is how we break out of the loop gracefully.
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(SweepInterval);

        // WaitForNextTickAsync waits one interval, then returns true. It returns false (ending the
        // loop) only when the timer is disposed or `stoppingToken` is cancelled at shutdown.
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            logger.LogInformation("Upload reconciliation sweep starting.");
            // The actual sweep (find + reconcile stuck posts) is added in the next steps.
        }
    }
}
