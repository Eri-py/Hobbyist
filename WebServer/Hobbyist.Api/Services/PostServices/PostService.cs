using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices;

public class PostService : IPostService
{
    public Task<Result<CreatePostResponse>> CreatePostAsync(
        CreatePostRequest request,
        string userId,
        CancellationToken ct
    )
    {
        Console.WriteLine("[CreatePost]");
        Console.WriteLine($"UserId: {userId}");
        Console.WriteLine($"Hobby: {request.Hobby}");
        Console.WriteLine($"Title: {request.Title}");
        Console.WriteLine($"Description: {request.Description}");
        Console.WriteLine($"AvailableForTrade: {request.AvailableForTrade}");
        Console.WriteLine($"LookingFor: {request.LookingFor ?? "(none)"}");
        Console.WriteLine($"MediaCount: {request.Media.Length}");

        foreach (var file in request.Media)
        {
            Console.WriteLine(
                $"Name={file.FileName}, ContentType={file.ContentType}, Size={file.Length}"
            );
        }

        var response = new CreatePostResponse
        {
            PostId = Guid.NewGuid(),
            UserId = userId,
            Hobby = request.Hobby,
            Title = request.Title,
            Description = request.Description,
            AvailableForTrade = request.AvailableForTrade,
            LookingFor = request.LookingFor,
            Media = [],
            CreatedAt = DateTimeOffset.UtcNow,
        };

        return Task.FromResult(Result<CreatePostResponse>.Success(response));
    }
}
