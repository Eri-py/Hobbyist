using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.LoginServices;

public interface ILoginService
{
    public Task<Result<StartLoginResponse>> StartLoginAsync(StartLoginRequest request);
    public Task<Result<AuthResult>> CompleteLoginAsync(CompleteLoginRequest request);
}
