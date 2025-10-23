import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Profile = () => {
    return (
        <View style={styles.container}>

            {/* Header with icons */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <MaterialIcons name="settings" size={30} color="#FFFFFF"/>
                </TouchableOpacity>

                <TouchableOpacity>
                    <MaterialIcons name="logout" size={30} color="#FFFFFF"/>
                </TouchableOpacity>
            </View>

            {/* Centered content */}
            <View style={styles.centeredContent}>
                <Text style={styles.logoutText}>
                    vous n’appartenez à aucune organisation ...
                </Text>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#C5BD83',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',       // important pour que les icônes soient aux extrémités
        paddingHorizontal: 20,
        paddingTop: 50,      // pour ne pas toucher la status bar
    },
    centeredContent: {
        flex: 1,                  // prend toute la hauteur restante
        justifyContent: 'center', // centre verticalement
        alignItems: 'center',     // centre horizontalement
    },
    logoutButton: {
        alignItems: 'center',     // centre le texte horizontalement dans le bouton
    },
    logoutText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#898989',
        textAlign: 'center',      // centre le texte si il fait plusieurs lignes
    },
});

export default Profile;
