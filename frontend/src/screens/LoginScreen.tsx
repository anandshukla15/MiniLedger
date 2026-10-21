import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getBaseUrl, setCustomBaseUrl } from '../services/api';
import { theme } from '../theme';

export const LoginScreen: React.FC = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [serverUrl, setServerUrl] = useState(getBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);

  const handleSendOtp = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (!phone || phone.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(phone.trim());
      setStep('OTP');
      if (res.mockOtp) {
        setInfoMessage(`Mock OTP printed in terminal! (Test code: ${res.mockOtp})`);
      } else {
        setInfoMessage('Mock OTP has been printed in your backend server terminal.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');

    if (!otp || otp.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP received in the server logs.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(phone.trim(), otp.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    try {
      await setCustomBaseUrl(serverUrl);
      setShowServerConfig(false);
      Alert.alert('Server URL Updated', `API base URL set to: ${serverUrl}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="book" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>
            Track money lent to friends, manage repayments & overdue balances seamlessly.
          </Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {errorMessage ? (
            <View style={styles.alertBoxError}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
              <Text style={styles.alertTextError}>{errorMessage}</Text>
            </View>
          ) : null}

          {infoMessage ? (
            <View style={styles.alertBoxInfo}>
              <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.alertTextInfo}>{infoMessage}</Text>
            </View>
          ) : null}

          {step === 'PHONE' ? (
            <View>
              <Text style={styles.sectionTitle}>Sign In with Phone</Text>
              <Text style={styles.sectionSubtitle}>
                Enter your mobile number to receive a mock OTP.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9876543210"
                    placeholderTextColor={theme.colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                  />
                </View>
              </View>

              {/* Demo quick-fill chip */}
              <TouchableOpacity
                onPress={() => setPhone('+919876543210')}
                style={styles.demoFillChip}
              >
                <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
                <Text style={styles.demoFillText}>Use Demo Number: +919876543210</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Get Mock OTP</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.otpHeaderRow}>
                <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Enter Verification Code</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Code sent to <Text style={{ fontWeight: '700' }}>{phone}</Text>. Check backend console logs.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit OTP</Text>
                <TextInput
                  style={[styles.phoneInput, styles.otpInput]}
                  placeholder="e.g. 123456"
                  placeholderTextColor={theme.colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
              </View>

              {/* Quick bypass test button */}
              <TouchableOpacity
                onPress={() => setOtp('123456')}
                style={styles.demoFillChip}
              >
                <Ionicons name="flash" size={14} color={theme.colors.primary} />
                <Text style={styles.demoFillText}>Fill Dev Test OTP: 123456</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify & Enter App</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                style={styles.resendButton}
              >
                <Text style={styles.resendText}>Didn't see the OTP? Resend Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dev Server URL toggle */}
          <View style={styles.serverConfigSection}>
            <TouchableOpacity
              onPress={() => setShowServerConfig(!showServerConfig)}
              style={styles.serverConfigToggle}
            >
              <Ionicons name="server-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.serverConfigToggleText}>
                API Server: {serverUrl}
              </Text>
              <Ionicons
                name={showServerConfig ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.serverConfigBox}>
                <TextInput
                  style={styles.serverInput}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://localhost:5000"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={handleSaveServerUrl} style={styles.serverSaveButton}>
                  <Text style={styles.serverSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  countryCodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    backgroundColor: '#F1F5F9',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  demoFillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
  },
  demoFillText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...theme.shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  resendText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  alertBoxError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.dangerLight,
    borderColor: theme.colors.dangerBorder,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  alertTextError: {
    color: theme.colors.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  alertBoxInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryBorder,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  alertTextInfo: {
    color: theme.colors.primary,
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  serverConfigSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  serverConfigToggleText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  serverConfigBox: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  serverInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    backgroundColor: '#F8FAFC',
  },
  serverSaveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  serverSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
