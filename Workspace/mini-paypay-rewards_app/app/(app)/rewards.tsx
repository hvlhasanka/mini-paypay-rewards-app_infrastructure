import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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

function RewardCard({ reward, balance }: { reward: Reward; balance: number }) {
  const soldOut = reward.stockRemaining <= 0;
  const insufficient = balance < reward.pointsCost;
  const locked = !soldOut && insufficient;
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePress = () => {
    if (locked) return;
    Alert.alert('Coming soon!');
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {reward.imageUrl ? (
          <>
            <Image
              source={{ uri: reward.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
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
            style={[styles.cta, soldOut && styles.ctaSoldOut, locked && styles.ctaLocked]}
            disabled={locked}
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
  const { items, balance, category, status, error } = useAppSelector((s) => s.rewards);

  const isInitialLoad = status === 'loading' && items.length === 0;

  useEffect(() => {
    dispatch(fetchRewards(category));
  }, [dispatch, category]);

  const ListHeader = (
    <>
      <View style={styles.balanceBlock}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        <View style={styles.balanceRow}>
          {isInitialLoad ? (
            <Skeleton width={160} height={36} />
          ) : (
            <Text style={styles.balanceValue}>{formatPoints(balance)}</Text>
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <RewardCard reward={item} balance={balance} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.loading}>
          <Text style={styles.emptyText}>No rewards available.</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
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
    borderRadius: 9999,
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
    borderRadius: 9999,
    backgroundColor: '#FFFFFFE5',
  },
  lockBadgeIcon: { width: 9.33, height: 12.25, tintColor: '#00003C' },
  lockBadgeText: {
    fontFamily: 'Interd',
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
    borderRadius: 9999,
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
    borderRadius: 9999,
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
