// utils/toastConfig.ts
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

const windowHeight = Dimensions.get('window').height;

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.success]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={[styles.toast, styles.error]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
    />
  ),
  favoritar: (props: any) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.favoritar]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
    />
  ),
  desfavoritar: (props: any) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.desfavoritar]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
    />
  ),
};

const styles = StyleSheet.create({
  toast: {
    borderLeftWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignSelf: 'center',
    position: 'absolute',
    top: windowHeight * 0.60,
    minWidth: '70%',
    height: 40, // 🔹 Altura menor
    width: 70
  },
  contentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  text1: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    color: '#333',
  },
  success: {
    backgroundColor: '#d1f7d6',
  },
  error: {
    backgroundColor: '#ffdada',
  },
  favoritar: {
    backgroundColor: '#e0ffe0',
  },
  desfavoritar: {
    backgroundColor: '#ffe0e0',
  },
});
