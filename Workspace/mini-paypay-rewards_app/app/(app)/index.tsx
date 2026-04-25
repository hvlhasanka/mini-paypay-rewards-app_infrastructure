import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { logout } from '@/store/authSlice';
import { fetchLedger, type LedgerEntry } from '@/store/ledgerSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface CategoryStyle {
  icon: ReturnType<typeof require>;
  label: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  reward: { icon: require('@/assets/icons/wrapped-box.png'), label: 'REWARD' },
  redemption: { icon: require('@/assets/icons/plane.png'), label: 'REDEMPTION' },
  dining: { icon: require('@/assets/icons/fork-and-knife.png'), label: 'DINING' },
  travel: { icon: require('@/assets/icons/car.png'), label: 'TRAVEL' },
  purchase: { icon: require('@/assets/icons/bag.png'), label: 'PURCHASE' },
};

function styleFor(category: string): CategoryStyle {
  return (
    CATEGORY_STYLES[category] ?? {
      icon: require('@/assets/icons/bag.png'),
      label: category.toUpperCase(),
    }
  );
}

const REASON_ICONS: Record<string, ReturnType<typeof require>> = {
  'Cashback Reward': require('@/assets/icons/cashback-reward.png'),
  'Interest Accrual': require('@/assets/icons/interest-accrual.png'),
  'Luxury Watch': require('@/assets/icons/luxury-watch.png'),
  'Transfer to External': require('@/assets/icons/transfer-to-external.png'),
};

function formatPoints(n: number): string {
  return n.toLocaleString('en-US');
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function ActivityRow({ entry }: { entry: LedgerEntry }) {
  const earned = entry.delta >= 0;
  const cat = styleFor(entry.category);
  const iconSource = REASON_ICONS[entry.reason] ?? cat.icon;
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIcon}>
        <Image source={iconSource} style={styles.activityIconImage} resizeMode="contain" />
      </View>
      <View style={styles.activityMain}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {entry.reason}
        </Text>
        <Text style={styles.activityMeta} numberOfLines={1}>
          {formatShortDate(entry.createdAt)} • {cat.label}
        </Text>
      </View>
      <View style={styles.activityAmount}>
        <Text style={[styles.amountValue, { color: earned ? '#00003C' : '#BA1A1A' }]}>
          {earned ? '+' : '-'}
          {formatPoints(Math.abs(entry.delta))}
        </Text>
        <Text style={styles.amountLabel}>POINTS</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const balance = useAppSelector((s) => s.auth.balance);
  const { items: ledgerItems } = useAppSelector((s) => s.ledger);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    dispatch(fetchLedger());
  }, [dispatch]);

  const recent = ledgerItems.slice(0, 5);
  const userInitial = 'S';

  const comingSoon = () => Alert.alert('Coming soon!');

  const goToRewards = () => router.push('/(app)/rewards');
  const goToHistory = () => router.push('/(app)/history');

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(logout());
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Current Assets card */}
      <View style={styles.assetsCard}>
        <Text style={styles.assetsLabel}>CURRENT ASSETS</Text>
        <Text style={styles.assetsValue}>{formatPoints(balance)}</Text>
        <Text style={styles.assetsSubtitle}>Vault Points Available</Text>
        <View style={styles.assetsFooter}>
          <View style={styles.assetsBadgeStack}>
            <View style={[styles.assetsBadge, styles.assetsBadgeBack]}>
              <Text style={styles.assetsBadgeText}>{userInitial}</Text>
            </View>
            <View style={[styles.assetsBadge, styles.assetsBadgeFront]}>
              <Image
                source={require('@/assets/icons/blue-star.png')}
                style={styles.assetsBadgeStar}
                resizeMode="contain"
              />
            </View>
          </View>
          <Pressable style={styles.redeemBtn} onPress={goToRewards}>
            <Text style={styles.redeemBtnText}>Redeem Now</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={comingSoon}>
          <View style={styles.quickIconCircle}>
            <Image
              source={require('@/assets/icons/blue-star.png')}
              style={styles.quickIconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.quickTitle}>Transfer Points</Text>
          <Text style={styles.quickSubtitle}>Send to partners</Text>
        </Pressable>
        <Pressable style={[styles.quickCard, styles.quickCardAlt]} onPress={comingSoon}>
          <View style={[styles.quickIconCircle, styles.quickIconCircleAlt]}>
            <Image
              source={require('@/assets/icons/card-plus.png')}
              style={styles.quickIconImageAlt}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.quickTitle}>Boost Earnings</Text>
          <Text style={styles.quickSubtitle}>Active multipliers</Text>
        </Pressable>
      </View>

      {/* Activity Log */}
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        <Pressable onPress={goToHistory} hitSlop={8}>
          <Text style={styles.viewAll}>VIEW ALL</Text>
        </Pressable>
      </View>
      <View style={styles.activityList}>
        {recent.length === 0 ? (
          <Text style={styles.emptyText}>No activity yet.</Text>
        ) : (
          recent.map((entry) => <ActivityRow key={entry.id} entry={entry} />)
        )}
      </View>

      {/* Platinum Exclusive promo */}
      <View style={styles.promoCard}>
        <View style={styles.promoTag}>
          <Text style={styles.promoTagText}>PLATINUM EXCLUSIVE</Text>
        </View>
        <Text style={styles.promoTitle}>Unlock the Safari Collection.</Text>
        <Text style={styles.promoBody}>
          Use 5,000 points to access curated travel experiences across Sub-Saharan Africa.
        </Text>
        <Pressable style={styles.promoLink} onPress={comingSoon} hitSlop={8}>
          <Text style={styles.promoLinkText}>Explore Collection</Text>
          <Image
            source={require('@/assets/icons/right-pointing-arrow.png')}
            style={styles.promoLinkArrow}
            resizeMode="contain"
          />
        </Pressable>
        <Image
          source={require('@/assets/images/Home-1-Luxury-Safari.png')}
          style={styles.promoImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.divider} />

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8FF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 140, gap: 16 },
  assetsCard: {
    minHeight: 220,
    justifyContent: 'space-between',
    backgroundColor: '#00003C',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0px 20px 40px 0px #1B1B220F',
  },
  assetsLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: '#FFE16D',
  },
  assetsValue: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -2.4,
    color: '#FFFFFF',
    marginTop: 8,
  },
  assetsSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#E4E1EBCC',
    marginBottom: 12,
  },
  assetsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  assetsBadgeStack: { flexDirection: 'row', alignItems: 'center' },
  assetsBadge: {
    width: 32,
    height: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00003C',
  },
  assetsBadgeBack: { backgroundColor: '#E4E1EB', paddingTop: 6, paddingBottom: 7 },
  assetsBadgeFront: { backgroundColor: '#FCD400', marginLeft: -12 },
  assetsBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#00003C',
  },
  assetsBadgeStar: {
    width: 12,
    height: 11,
    tintColor: '#00003C',
  },
  redeemBtn: {
    height: 36,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#FCD400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#6E5C00',
  },

  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    height: 161,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0px 20px 40px 0px #1B1B220F',
  },
  quickCardAlt: {
    backgroundColor: '#F5F2FC',
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 50,
    backgroundColor: '#0000801A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickIconImage: { width: 19, height: 16, tintColor: '#000080' },
  quickIconCircleAlt: { backgroundColor: '#FCD40033' },
  quickIconImageAlt: { width: 22, height: 18, tintColor: '#705D00' },
  quickTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22.5,
    letterSpacing: 0,
    color: '#1B1B22',
  },
  quickSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#464653',
  },

  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#1B1B22',
  },
  viewAll: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#00003C',
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#FCD400',
  },
  activityList: { gap: 10 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EFECF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconImage: { width: 16, height: 20, tintColor: '#464653' },
  activityMain: { flex: 1, gap: 4 },
  activityTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 15,
    color: '#00003C',
  },
  activityMeta: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#767684',
    textTransform: 'uppercase',
  },
  activityAmount: { alignItems: 'flex-end' },
  amountValue: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 16,
  },
  amountLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#767684',
    textTransform: 'uppercase',
  },

  promoCard: {
    backgroundColor: '#EAE7F0',
    borderRadius: 12,
    marginTop: 8,
    padding: 32,
    gap: 14,
    overflow: 'hidden',
  },
  promoTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#00003C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 23,
    borderRadius: 4,
  },
  promoTagText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    color: '#FCD400',
    textTransform: 'uppercase',
  },
  promoTitle: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: -0.75,
    color: '#00003C',
  },
  promoBody: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22.75,
    letterSpacing: 0,
    color: '#464653',
  },
  promoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promoLinkText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#00003C',
  },
  promoLinkArrow: { width: 16, height: 16, tintColor: '#00003C' },
  promoImage: {
    marginTop: 10,
    marginLeft: -32,
    marginRight: -32,
    marginBottom: -32,
    height: 200,
    width: undefined,
  },
  divider: {
    height: 3,
    borderRadius: 10,
    backgroundColor: '#6b6b7633',
    marginTop: 8,
  },
  logoutBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#00003C',
    paddingVertical: 25,
    borderRadius: 15,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#464653',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
