import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions } from 'react-native';
import { DownloadCloud, Sparkles } from 'lucide-react-native';
import { AnimatedCard } from '@/components/animated/AnimatedCard';
import { theme } from '@/theme';

interface UpdateCardProps {
    latestVersion: string;
    downloadUrl: string;
}

const { width } = Dimensions.get('window');

const UpdateNotificationCard: React.FC<UpdateCardProps> = ({ latestVersion, downloadUrl }) => {

    const handleDownload = () => {
        if (downloadUrl) {
            Linking.openURL(downloadUrl).catch((err) =>
                console.error("Couldn't load page", err)
            );
        }
    };

    return (
        <View style={styles.overlay}>
            <AnimatedCard style={styles.cardWrapper}>
                <View style={styles.innerContainer}>
                    {/* Badge/Small Icon */}
                    <View style={styles.badgeContainer}>
                        <Sparkles size={14} color={theme.colors.primary[500]} />
                        <Text style={styles.badgeText}>New Update</Text>
                    </View>

                    {/* Main Icon Section */}
                    <View style={styles.iconCircle}>
                        <DownloadCloud color={theme.colors.primary[500]} size={38} />
                    </View>

                    {/* Text Content */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Update Available</Text>
                        <Text style={styles.versionTag}>Version {latestVersion}</Text>
                        <Text style={styles.description}>
                            We've added new features and improved performance to give you a better experience.
                        </Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity 
                        activeOpacity={0.8} 
                        style={styles.downloadButton} 
                        onPress={handleDownload}
                    >
                        <DownloadCloud color="#FFF" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Download Now</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.footerNote}>Tap to download the latest APK</Text>
                </View>
            </AnimatedCard>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC', // Match your KYC background
        paddingHorizontal: 24,
    },
    cardWrapper: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 5,
    },
    innerContainer: {
        width: '100%',
        alignItems: 'center',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.primary[500]}10`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary[500],
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.primary[500]}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1E293B",
        textAlign: 'center',
    },
    versionTag: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary[500],
        marginTop: 4,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: "#64748B",
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    downloadButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary[500],
        paddingVertical: 16,
        width: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary[500],
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    footerNote: {
        marginTop: 16,
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    }
});

export default UpdateNotificationCard;