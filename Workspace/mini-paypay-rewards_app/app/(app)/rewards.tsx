import { useHeaderHeight } from '@react-navigation/elements';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import ConfirmationModal, { type ConfirmationStatus } from '@/components/confirmation-modal';
import { useCountUp } from '@/hooks/use-count-up';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api } from '@/services/api';
import { refreshMe } from '@/store/authSlice';
import { fetchLedger } from '@/store/ledgerSlice';
import {
  fetchRewards,
  setCategory,
  type Reward,
  type RewardCategory,
} from '@/store/rewardsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const CATEGORIES: { id: RewardCategory; label: string }[] = [
  { id: 'all', label: 'All Rewards' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'travel', label: 'Travel' },
];

function formatPoints(n: number): string {
  return n.toLocaleString('en-US');
}

function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]}
    />
  );
}

function RewardCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={180} borderRadius={0} />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Skeleton width="55%" height={20} />
          <Skeleton width={70} height={20} borderRadius={6} />
        </View>
        <Skeleton width="100%" height={14} />
        <Skeleton width="75%" height={14} />
        <View style={styles.cardFooter}>
          <View style={{ gap: 6 }}>
            <Skeleton width={40} height={10} />
            <Skeleton width={80} height={18} />
          </View>
          <Skeleton width={110} height={40} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge label="SOLD OUT" tint="#BA1A1A" bg="#FFDAD6" />;
  if (stock >= 13) return <Badge label="IN STOCK" tint="#705D00" bg="#FCD40033" />;
  return <Badge label={`${stock} LEFT`} tint="#705D00" bg="#FCD40033" />;
}

function Badge({ label, tint, bg }: { label: string; tint: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{label}</Text>
    </View>
  );
}

const MIN_SKELETON_MS = 1200;

function RewardCard({
  reward,
  balance,
  isOnline,
  onClaim,
}: {
  reward: Reward;
  balance: number;
  isOnline: boolean;
  onClaim: (reward: Reward) => void;
}) {
  const soldOut = reward.stockRemaining <= 0;
  const insufficient = balance < reward.pointsCost;
  const locked = !soldOut && insufficient;
  const claimDisabled = locked || soldOut || !isOnline;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const loadStartRef = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const finishLoad = () => {
    const elapsed = Date.now() - loadStartRef.current;
    const remaining = Math.max(MIN_SKELETON_MS - elapsed, 0);
    if (remaining === 0) {
      setImageLoaded(true);
    } else {
      timeoutRef.current = setTimeout(() => setImageLoaded(true), remaining);
    }
  };

  const handlePress = () => {
    if (claimDisabled) return;
    onClaim(reward);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {reward.imageUrl && !imageError ? (
          <>
            <Image
              source={{ uri: reward.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoad={finishLoad}
              onError={() => {
                setImageError(true);
                finishLoad();
              }}
            />
            {!imageLoaded ? (
              <View style={StyleSheet.absoluteFillObject}>
                <Skeleton width="100%" height="100%" borderRadius={0} />
              </View>
            ) : null}
          </>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderInitial}>{reward.name.charAt(0)}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {reward.name}
          </Text>
          <StockBadge stock={reward.stockRemaining} />
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {reward.description}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.costLabel}>COST</Text>
            <Text style={styles.costValue}>{formatPoints(reward.pointsCost)} pts</Text>
          </View>
          <Pressable
            style={[
              styles.cta,
              soldOut && styles.ctaSoldOut,
              (locked || (claimDisabled && !soldOut)) && styles.ctaLocked,
            ]}
            disabled={claimDisabled}
            onPress={handlePress}
          >
            <Text
              style={[
                styles.ctaText,
                soldOut && styles.ctaTextSoldOut,
                locked && styles.ctaTextLocked,
              ]}
            >
              {soldOut ? 'Notify Me' : locked ? 'Locked' : 'Claim Now'}
            </Text>
          </Pressable>
        </View>
      </View>

      {locked ? (
        <BlurView intensity={10} tint="dark" style={styles.lockOverlay}>
          <View style={styles.lockBadge}>
            <Image
              source={require('@/assets/icons/lock-two.png')}
              style={styles.lockBadgeIcon}
              resizeMode="contain"
            />
            <Text style={styles.lockBadgeText}>INSUFFICIENT POINTS</Text>
          </View>
        </BlurView>
      ) : null}

      {soldOut ? (
        <View style={styles.soldOutOverlay}>
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutBadgeText}>OUT OF STOCK</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function RewardsScreen() {
  const dispatch = useAppDispatch();
  const { items, category, status, error } = useAppSelector((s) => s.rewards);
  const balance = useAppSelector((s) => s.auth.balance);
  const animatedBalance = useCountUp(balance, 2500, 'down');
  const isOnline = useOnlineStatus();
  const headerHeight = useHeaderHeight();

  const isInitialLoad = status === 'loading' && items.length === 0;

  // Redeem confirmation modal state
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemStatus, setRedeemStatus] = useState<ConfirmationStatus>('confirm');
  const [redeemError, setRedeemError] = useState<string | undefined>(undefined);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(fetchRewards(category));
  }, [dispatch, category]);

  const openClaim = (reward: Reward) => {
    setSelectedReward(reward);
    setRedeemStatus('confirm');
    setRedeemError(undefined);
    idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  };

  const closeClaim = () => {
    setSelectedReward(null);
    setRedeemStatus('confirm');
    setRedeemError(undefined);
    idempotencyKeyRef.current = null;
  };

  const confirmClaim = async () => {
    if (!selectedReward || !idempotencyKeyRef.current || !isOnline) return;
    setRedeemStatus('loading');
    try {
      await api.post(
        `/rewards/${selectedReward.id}/redeem`,
        {},
        { headers: { 'X-Idempotency-Key': idempotencyKeyRef.current } },
      );

      await Promise.all([dispatch(refreshMe()), dispatch(fetchLedger())]);
      dispatch(fetchRewards(category));
      setRedeemStatus('success');
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        closeClaim();
        return;
      }
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: string } | undefined)?.error ??
          'Could not complete the redemption. Please try again.')
        : 'Could not complete the redemption. Please try again.';
      setRedeemError(msg);
      setRedeemStatus('error');
    }
  };

  const ListHeader = (
    <>
      <View style={styles.balanceBlock}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        <View style={styles.balanceRow}>
          {isInitialLoad ? (
            <Skeleton width={160} height={36} />
          ) : (
            <Text style={styles.balanceValue}>{formatPoints(animatedBalance)}</Text>
          )}
          <Image source={require('@/assets/icons/star.png')} style={styles.starIcon} resizeMode="contain" />
        </View>
        <View style={styles.tierRow}>
          <View style={styles.eliteTier}>
            <Text style={styles.eliteTierText}>ELITE TIER</Text>
          </View>
          <View style={styles.expiry}>
            <Text style={styles.expiryText}>EXPIRES IN 12D</Text>
          </View>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          return (
            <Pressable
              key={c.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => dispatch(setCategory(c.id))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  if (isInitialLoad) {
    return (
      <FlatList
        data={[0, 1, 2, 3]}
        keyExtractor={(i) => `skeleton-${i}`}
        renderItem={() => <RewardCardSkeleton />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 32 }]}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RewardCard
            reward={item}
            balance={balance}
            isOnline={isOnline}
            onClaim={openClaim}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.loading}>
            <Text style={styles.emptyText}>No rewards available.</Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 32 }]}
        showsVerticalScrollIndicator={false}
      />

      <ConfirmationModal
        visible={selectedReward !== null}
        status={redeemStatus}
        title={selectedReward?.name ?? ''}
        message={selectedReward?.description}
        heroImage={selectedReward?.imageUrl ? { uri: selectedReward.imageUrl } : null}
        detailLabel="Cost"
        detailValue={
          selectedReward
            ? `${selectedReward.pointsCost.toLocaleString('en-US')} pts`
            : undefined
        }
        confirmLabel="Confirm Redeem"
        successTitle="Redeemed!"
        successMessage={
          selectedReward
            ? `${selectedReward.name} has been added to your rewards.`
            : undefined
        }
        successDetailLabel="Balance deducted by"
        successDetailValue={
          selectedReward
            ? `${selectedReward.pointsCost.toLocaleString('en-US')} pts`
            : undefined
        }
        errorTitle="Redemption failed"
        errorMessage={redeemError}
        errorActionLabel="Try again"
        onConfirm={confirmClaim}
        onClose={closeClaim}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 120, gap: 16 },
  balanceBlock: { marginBottom: 8 },
  balanceLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#464653',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  balanceValue: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -1.2,
    color: '#00003C',
  },
  starIcon: { width: 30, height: 30, tintColor: '#FCD400', marginTop: -10 },
  tierRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  eliteTier: {
    backgroundColor: '#FFE16D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  eliteTierText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#221B00',
  },
  expiry: {
    backgroundColor: '#EAE7F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  expiryText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#464653',
  },
  chipsRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F2FC',
  },
  chipActive: { backgroundColor: '#00003C' },
  chipText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#464653',
  },
  chipTextActive: { color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageWrap: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#E7E4EE' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderInitial: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 56,
    color: '#00003C66',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00003C66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#FFFFFFE5',
  },
  lockBadgeIcon: { width: 9.33, height: 12.25, tintColor: '#00003C' },
  lockBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: '#00003C',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E4E1EB66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadge: {
    height: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#FFFFFFE5',
    borderWidth: 1,
    borderColor: '#C6C5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: '#767684',
  },
  cardBody: { padding: 16, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0,
    color: '#00003C',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  cardDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: '#464653',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  costLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.6,
    textTransform: 'uppercase',
    color: '#767684',
  },
  costValue: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
    color: '#00003C',
  },
  cta: {
    height: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: '#00003C',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0px 2px 4px 0px #FFFFFF1A',
  },
  ctaLocked: { backgroundColor: '#C6C5D5' },
  ctaSoldOut: { backgroundColor: '#E4E1EB' },
  ctaText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  ctaTextLocked: { color: '#FFFFFF' },
  ctaTextSoldOut: { color: '#767684' },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 8,
  },
  loading: { paddingVertical: 40, alignItems: 'center' },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#464653',
  },
});
