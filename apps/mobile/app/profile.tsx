import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Profile = () => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.profile_pic}>
                <MaterialIcons name="add" size={30} color="#FFFFFF"/>
            </TouchableOpacity>

            <TouchableOpacity>
                <Text>se Déconnecter</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C5BD83',
    },
    text: {
        fontSize: 24,
        color: '#333',
    },
    profile_pic: {
        backgroundColor: '#cfcfcf',
        borderRadius:  75,
        padding : 10,
    }
});

export default Profile;
