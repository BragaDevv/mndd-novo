import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onFinish: () => void;
  message: string;
}

const UnlockMessageLottie = ({ visible, onFinish, message }: Props) => {
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setRenderKey(prev => prev + 1); // força novo LottieView
      const timer = setTimeout(() => {
        onFinish();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.contentBox}>
        <LottieView
          key={renderKey}
          source={require("../assets/animations/unlock.json")}
          autoPlay
          loop={false}
          style={styles.animation}
        />
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height,
    width,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  contentBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.6,
    height: height * 0.25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  animation: {
    marginTop:-30,
    width: 150,
    height: 150,
  },
  messageText: {
    fontSize: 18,
    color: "#2e7d32",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default UnlockMessageLottie;
