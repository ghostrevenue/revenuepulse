import React, { useState, useEffect } from 'react';
import {
  render,
  extend,
  BlockStack,
  InlineLayout,
  Text,
  Image,
  Button,
  View,
  useCartLines,
  useApplyChangeset,
  useStorage,
} from '@shopify/checkout-ui-extensions';

interface OfferNode {
  id: string;
  type: 'single_product' | 'bundle' | 'quantity_upgrade' | 'subscription_upgrade';
  product: {
    product_id: string;
    variant_id: string;
    title: string;
    image_url: string;
    original_price: string;
    variant_title: string;
  };
  discount: { type: 'percentage' | 'fixed_amount' | 'fixed_price'; value: number };
  quantity: number;
  headline: string;
  message: string;
  accept_button_text: string;
  decline_button_text: string;
  countdown_timer: { enabled: boolean; duration_seconds: number } | null;
  on_accept_node_id: string | 'thank_you';
  on_decline_node_id: string | 'thank_you';
}

function computeDiscountedPrice(originalPrice: string, discount: OfferNode['discount']): number {
  const p = parseFloat(originalPrice);
  if (isNaN(p)) return p;
  if (discount.type === 'percentage') return p * (1 - discount.value / 100);
  if (discount.type === 'fixed_amount') return Math.max(0, p - discount.value);
  if (discount.type === 'fixed_price') return discount.value;
  return p;
}

function PostPurchaseExtension() {
  const cartLines = useCartLines();
  const applyChangeset = useApplyChangeset();
  const storage = useStorage();

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [funnelNodes, setFunnelNodes] = useState<OfferNode[]>([]);
  const [selectedQty, setSelectedQty] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'loading' | 'offer' | 'thankyou' | 'error'>('loading');

  // Load funnel nodes from extension storage (set by merchant via API)
  useEffect(() => {
    async function loadFunnel() {
      try {
        const data = await storage.get('funnel_data');
        if (data && data.nodes && data.nodes.length > 0) {
          setFunnelNodes(data.nodes);
          setCurrentNodeId(data.nodes[0].id);
          if (data.nodes[0].countdown_timer?.enabled) {
            setTimeLeft(data.nodes[0].countdown_timer.duration_seconds);
          }
          setStatus('offer');
        } else {
          setStatus('thankyou');
        }
      } catch (e) {
        setStatus('thankyou');
      }
    }
    loadFunnel();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || status !== 'offer') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleDecline();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, status]);

  const currentNode = funnelNodes.find(n => n.id === currentNodeId);
  const discountedPrice = currentNode
    ? computeDiscountedPrice(currentNode.product.original_price, currentNode.discount)
    : 0;
  const savings = currentNode
    ? parseFloat(currentNode.product.original_price) - discountedPrice
    : 0;

  async function handleAccept() {
    if (!currentNode) return;
    setStatus('loading');
    try {
      const changeset = {
        changes: [{
          type: 'add_variant' as const,
          variant_id: currentNode.product.variant_id,
          quantity: currentNode.quantity * selectedQty,
          discount: {
            value: currentNode.discount.type === 'percentage'
              ? { percentage: currentNode.discount.value }
              : currentNode.discount.type === 'fixed_amount'
              ? { fixed_amount: currentNode.discount.value }
              : { fixed_price: currentNode.discount.value },
            title: 'PostPurchasePro Upsell',
          },
        }],
      };
      const result = await applyChangeset(changeset);
      if (result.apply) {
        // Record event via fetch to merchant backend
        await fetch(`/api/funnels/${currentNode.id}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: currentNode.id, event_type: 'accept', amount: discountedPrice * selectedQty }),
        });
        // Route to next node or thank you
        const nextId = currentNode.on_accept_node_id;
        if (nextId && nextId !== 'thank_you') {
          const nextNode = funnelNodes.find(n => n.id === nextId);
          if (nextNode) {
            setCurrentNodeId(nextId);
            setSelectedQty(nextNode.quantity);
            setTimeLeft(nextNode.countdown_timer?.enabled ? nextNode.countdown_timer.duration_seconds : 0);
            setStatus('offer');
            return;
          }
        }
        setStatus('thankyou');
      } else {
        handleDecline();
      }
    } catch (e) {
      handleDecline();
    }
  }

  async function handleDecline() {
    if (!currentNode) return;
    await fetch(`/api/funnels/${currentNode.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: currentNode.id, event_type: 'decline', amount: 0 }),
    }).catch(() => {});
    const nextId = currentNode.on_decline_node_id;
    if (nextId && nextId !== 'thank_you') {
      const nextNode = funnelNodes.find(n => n.id === nextId);
      if (nextNode) {
        setCurrentNodeId(nextId);
        setSelectedQty(nextNode.quantity);
        setTimeLeft(nextNode.countdown_timer?.enabled ? nextNode.countdown_timer.duration_seconds : 0);
        return;
      }
    }
    setStatus('thankyou');
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (status === 'loading') {
    return (
      <BlockStack alignment="center" padding={['evenly', 'none']}>
        <Text>Loading offer...</Text>
      </BlockStack>
    );
  }

  if (status === 'thankyou' || !currentNode) {
    return (
      <BlockStack alignment="center" padding={['evenly', 'none']}>
        <Text appearance="heading2">Thank you!</Text>
        <Text>Your order is confirmed.</Text>
      </BlockStack>
    );
  }

  return (
    <BlockStack padding={['base', 'base']}>
      {currentNode.countdown_timer?.enabled && (
        <View background="Subtle" padding="base" borderRadius="base">
          <Text alignment="center" emphasis>
            ⏱ Offer expires in {formatTime(timeLeft)}
          </Text>
        </View>
      )}
      <InlineLayout columns={['400px']} padding={['none', 'none', 'base', 'none']}>
        <View>
          <BlockStack padding={['none', 'none', 'base', 'none']}>
            <Text appearance="heading2" alignment="center">
              {currentNode.headline}
            </Text>
            <Text alignment="center" appearance="body">
              {currentNode.message}
            </Text>
          </BlockStack>
          {currentNode.product.image_url && (
            <Image
              source={currentNode.product.image_url}
              description={currentNode.product.title}
              size="fill"
            />
          )}
          <BlockStack padding={['base', 'none', 'none', 'none']}>
            <Text alignment="center" emphasis>
              {currentNode.product.title}
            </Text>
            {currentNode.product.variant_title && (
              <Text alignment="center" appearance="body" subdued>
                {currentNode.product.variant_title}
              </Text>
            )}
            <InlineLayout columns={['auto', 'auto']} padding={['base', 'none', 'none', 'none']} spacing="loose">
              <Text appearance="body" subdued decoration="lineThrough">
                ${parseFloat(currentNode.product.original_price).toFixed(2)}
              </Text>
              <Text emphasis appearance="heading3">
                ${discountedPrice.toFixed(2)}
              </Text>
            </InlineLayout>
            <Text appearance="body" emphasis color="Success">
              You save ${savings.toFixed(2)}
            </Text>
          </BlockStack>
          <BlockStack padding={['base', 'none', 'none', 'none']}>
            <Button
              onPress={handleAccept}
              kind="primary"
              fill
            >
              {currentNode.accept_button_text} — ${discountedPrice.toFixed(2)}
            </Button>
            <Button onPress={handleDecline} kind="transparent">
              {currentNode.decline_button_text}
            </Button>
          </BlockStack>
        </View>
      </InlineLayout>
    </BlockStack>
  );
}

extend('purchase.post.render', (root) => {
  root.appendChild(<PostPurchaseExtension />);
  root.forceUpdate();
});
