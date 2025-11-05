import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Navbar from "@/components/navbar";

const { width } = Dimensions.get('window');

const Organisation = () => {
    const [activePage, setActivePage] = useState(0);

    const pages = [
        {
            text: "Vous n’appartenez à aucune organisation.\nCréez-en une en cliquant ci-dessous",
            icon: <MaterialIcons name="add-circle" size={60} color="#fff" />,
            label: "Créer une organisation",
        },
        {
            text: "Ou rejoignez-en une existante",
            icon: <MaterialIcons name="photo-camera" size={60} color="#fff" />,
            label: "Scanner un QR code",
        },
    ];

    const handleScroll = (event: any) => {
        const pageIndex = Math.round(event.nativeEvent.contentOffset.x / (width * 0.8));
        setActivePage(pageIndex);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {['settings', 'logout'].map((icon) => (
                    <TouchableOpacity key={icon} style={styles.headerIcon}>
                        <MaterialIcons name={icon} size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Contenu centré */}
            <View style={styles.centeredContent}>
                <View style={styles.card}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                        contentContainerStyle={{
                            alignItems: 'center',
                            height: '100%',
                        }}
                    >
                        {pages.map((page, index) => (
                            <View style={styles.innerContent} key={index}>
                                <Text style={styles.message}>{page.text}</Text>

                                <TouchableOpacity style={styles.actionButton}>
                                    {page.icon}
                                    <Text style={styles.buttonLabel}>{page.label}</Text>
                                </TouchableOpacity>

                                {index === 1 && (
                                    <View style={styles.secondChoice}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nom de l'organisation"
                                            placeholderTextColor="#777"
                                        />
                                        <TouchableOpacity style={styles.joinButton}>
                                            <Text style={styles.joinText}>Rejoindre</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.dotContainer}>
                        {pages.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    activePage === index && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </View>

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    headerIcon: {
        padding: 6,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#D9D9D9',
        borderRadius: 12,
        padding: 16,
        maxWidth: '90%',
        height: 380,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    innerContent: {
        width: width * 0.8,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: '#898989',
        width: '80%',
        paddingVertical: 15,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 20,
    },
    buttonLabel: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 8,
        fontSize: 16,
    },
    secondChoice: {
        width: '80%',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
        color: '#333',
    },
    joinButton: {
        backgroundColor: '#555',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    joinText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dotContainer: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#C0C0C0',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#898989',
    },
});

export default Organisation;
