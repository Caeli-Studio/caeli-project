import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Groupe() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Page Groupe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C5BD83' },
  text: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
});