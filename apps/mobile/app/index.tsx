import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, BackHandler } from 'react-native';


export default function Index() {

  const [inputValue, setInputValue] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.connexion_titre}>Connectez-vous</Text>

          <TextInput
            placeholder="exemple@gmail.com"
            value={inputValue}
            onChangeText={setInputValue}
            style={{ height: 40, backgroundColor: 'white', borderWidth: 0, borderRadius : 10, width : 300 }}
          />

          <TextInput
            value={password}
            onChangeText={text => setPassword(text)}
            placeholder="enter password"
            secureTextEntry={true}
            style={{ height: 40, backgroundColor: 'white', borderWidth: 0, borderRadius : 10, width : 300, marginTop : 20 }}
          />

          <TouchableOpacity>
            <Text style = {styles.bouton_connexion}>connexion</Text>
          </TouchableOpacity>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#C5BD83",
  },
  connexion_titre: {
    fontSize: 32,
    fontWeight : "bold",
    color : "#FFFFFF",
  },

  bouton_connexion :{
    backgroundColor : "white",
    paddingVertical : 15 ,
    paddingHorizontal : 35,
    borderRadius : 8,
    marginTop : 20,
  }
});
