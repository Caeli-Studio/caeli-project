import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // <-- à importer

const Home = () => {
    const navigation = useNavigation(); // <-- hook pour accéder à la navigation

    return (
        <View style={styles.container}>
            {/* --- le navbar ---- */}
            <View style={styles.navbar}>

                <TouchableOpacity>
                    <MaterialIcons name="search" size={30} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('organisation')}>
                    <MaterialIcons name="group" size={30} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('profile')}>
                    <MaterialIcons name="account-circle" size={30} color="#FFFFFF" />
                </TouchableOpacity>

            </View>

            {/* --- autre element --- */}
            <View style={styles.content}>
                <Text style={styles.text}>Well done!</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingVertical: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default Home;
