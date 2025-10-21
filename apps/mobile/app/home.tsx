import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Well done!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Permet au conteneur de prendre tout l'espace disponible
    justifyContent: 'center', // Centre les éléments verticalement
    alignItems: 'center', // Centre les éléments horizontalement
    backgroundColor: '#fff', // Définit la couleur de fond en blanc
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default Home;