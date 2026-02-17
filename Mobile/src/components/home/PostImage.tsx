import { View, StyleSheet, Image } from "react-native";

type PostImageProps = {
  imageUrl: string;
};

export function PostImage({ imageUrl }: PostImageProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
});
