// components/SuccessMessage.tsx
import React, { useEffect } from "react";
import { Text, StyleSheet, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onFinish: () => void;
}

const SuccessMessage = ({ visible, onFinish }: Props) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-30);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });

      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-30, { duration: 300 }, () => {
          runOnJS(onFinish)();
        });
      }, 2500);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: '50%',
    left: width * 0.1,
    width: width * 0.8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#e6ffe6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <FontAwesome name="check-circle" size={24} color="#2e7d32" />
      <Text style={styles.text}>Cadastro realizado com sucesso!</Text>
      <Text style={styles.text}>Bem vindo ao app MNDD </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
});

export default SuccessMessage;
