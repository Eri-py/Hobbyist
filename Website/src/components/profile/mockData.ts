export type ProfilePost = {
  id: string;
  imageUrl: string;
};

export const mockProfilePosts: ProfilePost[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  imageUrl: `https://picsum.photos/seed/profile-post-${i + 1}/1080/1080`,
}));
