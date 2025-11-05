import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Navbar from "@/components/navbar";

const Profile = () => {
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== 'granted') {
            Alert.alert("Permission refusée", "Autorisez l’accès à la galerie pour changer la photo.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* PHOTO DE PROFIL */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.profilePic} onPress={pickImage}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.image} />
                        ) : (
                            <MaterialIcons name="add" size={60} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.userName}>Alex Dupont</Text>
                    <Text style={styles.userRole}>Développeur & Productif 🚀</Text>
                </View>

                {/* STATS */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>42</Text>
                        <Text style={styles.statLabel}>Tâches faites</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>5</Text>
                        <Text style={styles.statLabel}>Aujourd’hui</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>7🔥</Text>
                        <Text style={styles.statLabel}>Jours actifs</Text>
                    </View>
                </View>

                {/* OPTIONS */}
                <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.optionButton}>
                        <MaterialIcons name="edit" size={24} color="#333" />
                        <Text style={styles.optionText}>Modifier le profil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionButton}>
                        <MaterialIcons name="palette" size={24} color="#333" />
                        <Text style={styles.optionText}>Changer le thème</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert("Notifications")}>
                        <MaterialIcons name="notifications" size={24} color="#333" />
                        <Text style={styles.optionText}>Notifications</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.optionButton, { backgroundColor: '#E74C3C' }]} onPress={() => Alert.alert("Déconnexion")}>
                        <MaterialIcons name="logout" size={24} color="#fff" />
                        <Text style={[styles.optionText, { color: '#fff' }]}>Se déconnecter</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <Navbar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#C5BD83',
    },
    header: {
        alignItems: 'center',
        marginTop: 50,
    },
    profilePic: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#b3b3b3',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginTop: 15,
    },
    userRole: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 30,
    },
    statCard: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 3,
        marginHorizontal: 10,
        marginBottom: 10,
        minWidth: 120,
        flex: 1,
        maxWidth: 150,
    },


    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
    },
    optionsContainer: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    optionText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },

});

export default Profile;
