import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onFinish: () => void;
  message: string;
}

const LoadingMessageLottie = ({ visible, onFinish, message }: Props) => {
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setRenderKey(prev => prev + 1); // força novo LottieView
      const timer = setTimeout(() => {
        onFinish();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.contentBox}>
        <LottieView
          key={renderKey}
          source={require("../assets/animations/loading.json")}
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
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  animation: {
    width: 120,
    height: 120,
  },
  messageText: {
    marginTop: 5,
    paddingBottom: 21,
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "Montserrat_500Medium",
  },
});

export default LoadingMessageLottie;
