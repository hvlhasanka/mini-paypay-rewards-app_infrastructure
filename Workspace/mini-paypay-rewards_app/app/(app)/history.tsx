import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import ArrowSpinningLoader from '@/components/arrow-spinning-loader';
import ThreeDotsLoader from '@/components/three-dots-loader';
import { refreshMe } from '@/store/authSlice';
import { fetchLedger, fetchMoreLedger, type LedgerEntry } from '@/store/ledgerSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const MILESTONE_REASON = 'Referral Platinum Bonus';

const POINTS_TO_USD = 1;
function pointsToUsd(points: number): string {
  return (Math.abs(points) * POINTS_TO_USD).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthHeader(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

interface CategoryStyle {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  tint: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  reward: { icon: 'gift-outline', bg: '#FFF6CC', tint: '#B45309' },
  redemption: { icon: 'bag-outline', bg: '#FDECEC', tint: '#DC2626' },
  dining: { icon: 'restaurant-outline', bg: '#FFEFD6', tint: '#9A3412' },
  travel: { icon: 'airplane-outline', bg: '#E0F0FF', tint: '#1D4ED8' },
  purchase: { icon: 'card-outline', bg: '#EAE7F0', tint: '#464653' },
};

function styleFor(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? { icon: 'ellipse-outline', bg: '#EAE7F0', tint: '#464653' };
}

const REASON_ICONS: Record<string, ReturnType<typeof require>> = {
  'Cashback Reward': require('@/assets/icons/cashback-reward.png'),
  'Interest Accrual': require('@/assets/icons/interest-accrual.png'),
  'Luxury Watch': require('@/assets/icons/luxury-watch.png'),
  'Transfer to External': require('@/assets/icons/transfer-to-external.png'),
};

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

function ActivityRow({ entry }: { entry: LedgerEntry }) {
  const earned = entry.delta >= 0;
  const cat = styleFor(entry.category);
  const customIcon = REASON_ICONS[entry.reason];

  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: cat.bg }]}>
        {customIcon ? (
          <Image
            source={customIcon}
            style={[styles.rowIconImage, { tintColor: cat.tint }]}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name={cat.icon} size={20} color={cat.tint} />
        )}
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{entry.reason}</Text>
        <View style={styles.rowMetaLine}>
          {entry.source ? (
            <>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {entry.source}
              </Text>
              <Text style={styles.rowMeta}> • </Text>
            </>
          ) : null}
          <Text style={styles.rowMeta}>{formatTime(entry.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.rowAmount}>
        <Text style={[styles.amount, { color: earned ? '#2E7D32' : '#BA1A1A' }]}>
          {earned ? '+ ' : '- '}${pointsToUsd(entry.delta)}
        </Text>
        <Text style={styles.amountLabel}>{earned ? 'EARNED' : 'REDEEMED'}</Text>
      </View>
    </View>
  );
}

function MilestoneCard({ entry }: { entry: LedgerEntry }) {
  return (
    <View style={styles.milestone}>
      <View style={{ flex: 1 }}>
        <View style={styles.milestoneTag}>
          <Text style={styles.milestoneTagText}>MILESTONE REACHED</Text>
        </View>
        <Text style={styles.milestoneTitle}>{entry.reason}</Text>
        <Text style={styles.milestoneSubtitle}>
          {entry.source ?? 'Welcome to the Vault'}
        </Text>
        <Text style={styles.milestoneAmount}>+ ${pointsToUsd(entry.delta)}</Text>
      </View>
      <Image
        source={require('@/assets/icons/light-star.png')}
        style={styles.milestoneStar}
        resizeMode="contain"
      />
    </View>
  );
}

function ActivitySkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={[styles.rowMain, { gap: 6 }]}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={14} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Skeleton width={80} height={16} />
        <Skeleton width={56} height={12} />
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const dispatch = useAppDispatch();
  const { items, page, hasMore, status, error } = useAppSelector((s) => s.ledger);
  const balance = useAppSelector((s) => s.auth.balance);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    dispatch(fetchLedger());
  }, [dispatch]);

  const isInitialLoad = status === 'loading' && items.length === 0;

  // Minimum visible duration for both indicators so they don't flash for
  // one frame on a fast network.
  const MIN_REFRESH_MS = 2400;

  const [refreshingUI, setRefreshingUI] = useState(false);
  const refreshStartRef = useRef<number | null>(null);
  const [loadingMoreUI, setLoadingMoreUI] = useState(false);
  const loadingMoreStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'refreshing') {
      refreshStartRef.current = Date.now();
      setRefreshingUI(true);
      return;
    }
    if (refreshStartRef.current != null) {
      const elapsed = Date.now() - refreshStartRef.current;
      const remaining = Math.max(MIN_REFRESH_MS - elapsed, 0);
      const t = setTimeout(() => {
        setRefreshingUI(false);
        refreshStartRef.current = null;
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'loadingMore') {
      loadingMoreStartRef.current = Date.now();
      setLoadingMoreUI(true);
      return;
    }
    if (loadingMoreStartRef.current != null) {
      const elapsed = Date.now() - loadingMoreStartRef.current;
      const remaining = Math.max(MIN_REFRESH_MS - elapsed, 0);
      const t = setTimeout(() => {
        setLoadingMoreUI(false);
        loadingMoreStartRef.current = null;
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [status]);

  const onEndReached = () => {
    if (hasMore && status === 'idle') {
      dispatch(fetchMoreLedger(page + 1));
    }
  };

  const onRefresh = () => {
    refreshStartRef.current = Date.now();
    setRefreshingUI(true);
    dispatch(fetchLedger());
    dispatch(refreshMe());
  };

  const comingSoon = () => Alert.alert('Coming soon!');

  type Row =
    | { type: 'entry'; entry: LedgerEntry }
    | { type: 'milestone'; entry: LedgerEntry }
    | { type: 'header'; key: string; label: string };

  const rows: Row[] = [];
  let lastHeader = '';
  let isFirstHeader = true;
  for (const entry of items) {
    const header = formatMonthHeader(entry.createdAt);
    if (header !== lastHeader) {
      if (!isFirstHeader) {
        rows.push({ type: 'header', key: `h-${header}`, label: header });
      }
      isFirstHeader = false;
      lastHeader = header;
    }
    if (entry.reason === MILESTONE_REASON) {
      rows.push({ type: 'milestone', entry });
    } else {
      rows.push({ type: 'entry', entry });
    }
  }
  const firstMonthLabel = items.length > 0 ? formatMonthHeader(items[0]!.createdAt) : '';

  const ListHeader = (
    <>
      {refreshingUI ? (
        <View style={styles.statusRow}>
          <ArrowSpinningLoader size={14} color="#767684" />
          <Text style={styles.statusText}>UPDATING LEDGER</Text>
        </View>
      ) : null}

      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>PORTFOLIO VALUE</Text>
        <View style={styles.portfolioRow}>
          <Text style={styles.portfolioCurrency}>$</Text>
          <Text style={styles.portfolioValue}>
            {isInitialLoad ? '—' : pointsToUsd(balance)}
          </Text>
        </View>
        <BlurView intensity={20} tint="light" style={styles.portfolioPill}>
          <Image
            source={require('@/assets/icons/arrow-trending-up.png')}
            style={{
              width: 12,
              height: 7,
              tintColor: '#FCD400',
              resizeMode: 'contain',
            }}
          />
          <Text style={styles.portfolioPillText}>+12.4%</Text>
        </BlurView>
      </View>

      <View style={styles.searchRow}>
        <Pressable style={styles.searchInputWrap} onPress={comingSoon}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            placeholder="Search History"
            placeholderTextColor="#767684"
            style={styles.searchInput}
            editable={false}
            pointerEvents="none"
          />
        </Pressable>
        <Pressable style={styles.filterButton} onPress={comingSoon} hitSlop={8}>
          <Image
            source={require('@/assets/icons/filter.png')}
            style={styles.filterIcon}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {firstMonthLabel ? (
          <Text style={[styles.monthHeader, styles.monthHeaderInline]}>{firstMonthLabel}</Text>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  if (isInitialLoad) {
    return (
      <FlatList
        data={[0, 1, 2, 3, 4]}
        keyExtractor={(i) => `s-${i}`}
        renderItem={() => <ActivitySkeleton />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 32 }]}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(row, idx) =>
        row.type === 'header' ? row.key : `${row.entry.id}-${idx}`
      }
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return <Text style={styles.monthHeader}>{item.label}</Text>;
        }
        if (item.type === 'milestone') return <MilestoneCard entry={item.entry} />;
        return <ActivityRow entry={item.entry} />;
      }}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No activity yet.</Text>
        </View>
      }
      ListFooterComponent={
        loadingMoreUI ? (
          <View style={styles.footerLoading}>
            <ThreeDotsLoader size={6} color="#767684" />
            <Text style={styles.footerText}>LOADING OLDER ENTRIES</Text>
          </View>
        ) : !hasMore && items.length > 0 ? (
          <Text style={styles.footerText}>End of history</Text>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      refreshControl={
        <RefreshControl
          refreshing={refreshingUI}
          onRefresh={onRefresh}
          tintColor="transparent"
          colors={['transparent']}
          progressBackgroundColor="transparent"
        />
      }
      contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 32 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 120 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 0,
    marginBottom: 30,
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#767684',
  },
  portfolioCard: {
    backgroundColor: '#00003C',
    borderRadius: 12,
    padding: 32,
    gap: 8,
    height: 180,
    boxShadow: '0px 20px 40px 0px #1B1B220F',
  },
  portfolioLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 2,
    color: '#FFFFFF99',
    textTransform: 'uppercase',
  },
  portfolioRow: { flexDirection: 'row', alignItems: 'flex-end' },
  portfolioCurrency: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
    color: '#FCD400',
    marginRight: 4,
  },
  portfolioValue: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.9,
    color: '#FFFFFF',
  },
  portfolioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 28,
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 12,
  },
  portfolioPillText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E4E1EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 60,
    borderRadius: 50,
  },
  searchIcon: { width: 18, height: 18, tintColor: '#767684' },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
    color: '#767684',
    padding: 0,
  },
  filterIcon: { width: 20, height: 20, tintColor: '#464653' },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 50,
    backgroundColor: '#F5F2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: '#1B1B22',
  },
  monthHeaderInline: {
    marginTop: 0,
    marginBottom: 0,
  },
  monthHeader: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    color: '#767684',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconImage: { width: 20, height: 19 },
  rowMain: { flex: 1, gap: 4 },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#1B1B22',
  },
  rowMeta: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#767684',
  },
  rowAmount: { alignItems: 'flex-end', gap: 2 },
  amount: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'right',
  },
  amountLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    textAlign: 'right',
    textTransform: 'uppercase',
    color: '#767684',
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 181,
    backgroundColor: '#F5F2FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C5D533',
    padding: 24,
    marginBottom: 10,
  },
  milestoneTag: {
    alignSelf: 'flex-start',
    height: 19,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FCD400',
    marginBottom: 8,
  },
  milestoneTagText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: '#00003C',
  },
  milestoneTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
    color: '#1B1B22',
    marginBottom: 4,
  },
  milestoneSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: '#767684',
    marginBottom: 8,
  },
  milestoneAmount: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#2E7D32',
  },
  milestoneStar: {
    width: 56,
    height: 56,
    alignSelf: 'flex-start',
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#DC2626',
    textAlign: 'center',
    marginVertical: 8,
  },
  footerLoading: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  footerText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#767684',
    paddingVertical: 16,
  },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#464653',
  },
});
