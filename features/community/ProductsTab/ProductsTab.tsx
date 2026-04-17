"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Input } from "@heroui/react/input";
import { toast } from "@heroui/react/toast";
import { getProductDetail } from "@/lib/api/store";
import { useAuth } from "@/lib/hooks/use-auth";
import {
    useAddCartItem,
    useApplyCoupon,
    useCart,
    useClearCart,
    useCreateCheckout,
    useRemoveCartItem,
    useRemoveCoupon,
    useTenantProducts,
    useUpdateCartItem,
} from "@/lib/hooks/use-store";
import type {
    Cart,
    CartItem,
    Product,
    ProductVariant,
    StoreCheckoutRequest,
} from "@/lib/types/store";

interface Props {
    tenantSlug: string;
}

type DeliveryMethod = StoreCheckoutRequest["delivery_method"];
type PaymentMethod = StoreCheckoutRequest["payment_method"];
type PendingProductAction = "add" | "direct";

interface VariantPickerState {
    product: Product;
    variants: ProductVariant[];
    action: PendingProductAction;
}

const DELIVERY_OPTIONS: Array<{ key: DeliveryMethod; label: string }> = [
    { key: "SHIPPING", label: "Envio" },
    { key: "PICKUP", label: "Retiro en tienda" },
    { key: "IN_PERSON", label: "Entrega en persona" },
];

const PAYMENT_OPTIONS: Array<{ key: PaymentMethod; label: string }> = [
    { key: "WEBPAY", label: "Webpay" },
    { key: "MERCADOPAGO", label: "Mercado Pago" },
    { key: "TRANSFER", label: "Transferencia" },
];

const PAYMENT_START_ERROR = "No se pudo iniciar el pago. Intenta nuevamente.";
const ORDER_CREATED_FALLBACK_MESSAGE = "Pedido creado. Revisa tus ordenes en tu perfil.";

function formatCLP(value: number | undefined) {
    if (typeof value !== "number") return "Consultar";
    return value.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    });
}

function getProductName(product: Product): string {
    return product.name || product.title || "Producto";
}

function getProductImage(product: Product): string | undefined {
    return product.image_url || product.images?.[0]?.thumbnail_url || product.images?.[0]?.url;
}

function canBuyProduct(product: Product): boolean {
    if (product.in_stock === false) return false;
    if (typeof product.stock === "number") return product.stock > 0;
    return true;
}

function getCartItemName(item: CartItem): string {
    return item.product_name || item.name || "Producto";
}

function getCartItemUnitPrice(item: CartItem): number {
    return item.unit_price ?? item.price ?? 0;
}

function getCartItemTotal(item: CartItem): number {
    return item.total ?? getCartItemUnitPrice(item) * item.quantity;
}

function getCartItemId(item: CartItem): string | number {
    return item.id;
}

function getCartTotalItems(cart: Cart | undefined): number {
    if (!cart) return 0;
    if (typeof cart.item_count === "number") return cart.item_count;
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
}

function getVariantLabel(variant: ProductVariant): string {
    const stockLabel = typeof variant.stock === "number" ? ` · stock ${variant.stock}` : "";
    return `${variant.name}${stockLabel}`;
}

interface CartSnapshotItem {
    productId: string;
    quantity: number;
    variantId?: string | number;
}

export default function ProductsTab({ tenantSlug }: Props) {
    const router = useRouter();
    const { status } = useAuth();
    const isAuthenticated = status === "authenticated";

    const [page, setPage] = useState(1);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("SHIPPING");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WEBPAY");
    const [couponCode, setCouponCode] = useState("");
    const [shipping, setShipping] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        region: "",
        postal_code: "",
        country: "CL",
    });

    const [activeProductId, setActiveProductId] = useState<string | null>(null);
    const [activeDirectProductId, setActiveDirectProductId] = useState<string | null>(null);
    const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);
    const [variantLookup, setVariantLookup] = useState<{ productId: string; action: PendingProductAction } | null>(null);
    const [variantPicker, setVariantPicker] = useState<VariantPickerState | null>(null);
    const [variantPickerSelectedId, setVariantPickerSelectedId] = useState<string | number | undefined>(undefined);
    const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({});
    const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string | number>>({});

    const { data, isLoading, isError } = useTenantProducts(tenantSlug, {
        per_page: 12,
        page,
        sort: "newest",
    });

    const {
        data: cartData,
        isLoading: isCartLoading,
        isError: isCartError,
    } = useCart(tenantSlug, isAuthenticated);

    const addCartItem = useAddCartItem();
    const clearCart = useClearCart();
    const removeCartItem = useRemoveCartItem();
    const updateCartItem = useUpdateCartItem();
    const applyCoupon = useApplyCoupon();
    const removeCoupon = useRemoveCoupon();
    const createCheckout = useCreateCheckout();

    const products = data?.products ?? [];
    const totalPages = data?.meta?.total_pages ?? 1;
    const totalProducts = data?.meta?.total;
    const currentPage = data?.meta?.page ?? page;
    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const cart = cartData?.cart;
    const cartItems = cart?.items ?? [];
    const cartWarnings = cart?.warnings ?? [];
    const cartItemCount = getCartTotalItems(cart);
    const cartSubtotal = cart?.subtotal ?? cartItems.reduce((acc, item) => acc + getCartItemTotal(item), 0);
    const cartDiscount = cart?.discount ?? 0;
    const cartTotal = cart?.total ?? Math.max(0, cartSubtotal - cartDiscount);

    const isCheckoutPending = createCheckout.isPending;
    const isCouponPending = applyCoupon.isPending || removeCoupon.isPending;
    const isActionPending = addCartItem.isPending || clearCart.isPending || createCheckout.isPending;
    const hasBlockingCartWarnings = cartWarnings.some(
        (warning) => warning.type === "OUT_OF_STOCK" || warning.type === "PRODUCT_UNAVAILABLE",
    );

    async function ensureVariants(product: Product): Promise<ProductVariant[]> {
        const cached = variantsByProduct[product.id];
        if (cached) return cached;

        if (Array.isArray(product.variants) && product.variants.length > 0) {
            setVariantsByProduct((prev) => ({ ...prev, [product.id]: product.variants! }));
            return product.variants;
        }

        const detail = await getProductDetail(product.id);
        const detailVariants = Array.isArray(detail.product?.variants) ? detail.product.variants : [];
        setVariantsByProduct((prev) => ({ ...prev, [product.id]: detailVariants }));
        return detailVariants;
    }

    function buildCheckoutPayload(): StoreCheckoutRequest | null {
        const payload: StoreCheckoutRequest = {
            delivery_method: deliveryMethod,
            payment_method: paymentMethod,
        };

        if (deliveryMethod === "SHIPPING") {
            const name = shipping.name.trim();
            const phone = shipping.phone.trim();
            const address = shipping.address.trim();
            const city = shipping.city.trim();
            const region = shipping.region.trim();
            const postalCode = shipping.postal_code.trim();
            const country = "CL";

            if (!name || !phone || !address || !city || !region) {
                toast.danger("Completa los datos de envio");
                return null;
            }

            payload.shipping_address = {
                name,
                phone,
                address,
                city,
                region,
                ...(postalCode ? { postal_code: postalCode } : {}),
                country,
            };
        }

        return payload;
    }

    async function restoreCartSnapshot(snapshot: CartSnapshotItem[]): Promise<boolean> {
        try {
            await clearCart.mutateAsync({ tenantSlug });
            for (const item of snapshot) {
                await addCartItem.mutateAsync({
                    tenantSlug,
                    productId: item.productId,
                    quantity: item.quantity,
                    ...(item.variantId !== undefined ? { variantId: item.variantId } : {}),
                });
            }
            return true;
        } catch {
            return false;
        }
    }

    async function executeAddToCart(product: Product, variantId?: string | number) {
        if (isActionPending) return;
        setActiveProductId(product.id);
        try {
            await addCartItem.mutateAsync({
                tenantSlug,
                productId: product.id,
                quantity: 1,
                ...(variantId !== undefined ? { variantId } : {}),
            });
            toast.success("Producto agregado al carrito");
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo agregar al carrito";
            toast.danger(message);
        } finally {
            setActiveProductId(null);
        }
    }

    async function executeDirectBuy(product: Product, variantId?: string | number) {
        if (isActionPending) return;
        const payload = buildCheckoutPayload();
        if (!payload) return;

        if (cartItemCount > 0) {
            const confirmReplace = window.confirm(
                "Comprar directo reemplazara el carrito actual de esta tienda. ¿Continuar?",
            );
            if (!confirmReplace) return;
        }

        setActiveDirectProductId(product.id);
        const previousCartSnapshot: CartSnapshotItem[] = cartItems.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            ...(item.variant_id !== undefined ? { variantId: item.variant_id } : {}),
        }));
        let cartReplaced = false;
        try {
            await clearCart.mutateAsync({ tenantSlug });
            cartReplaced = true;
            await addCartItem.mutateAsync({
                tenantSlug,
                productId: product.id,
                quantity: 1,
                ...(variantId !== undefined ? { variantId } : {}),
            });

            const checkout = await createCheckout.mutateAsync({
                tenantSlug,
                payload,
            });
            toast.success("Compra directa iniciada");

            if (checkout.payment_url) {
                window.location.href = checkout.payment_url;
                return;
            }
            toast.success(ORDER_CREATED_FALLBACK_MESSAGE);
            router.push("/perfil/me");
        } catch (error) {
            const message = error instanceof Error && error.message
                ? error.message
                : PAYMENT_START_ERROR;
            toast.danger(message);
            if (cartReplaced && previousCartSnapshot.length > 0) {
                const restored = await restoreCartSnapshot(previousCartSnapshot);
                if (restored) {
                    toast.success("Tu carrito anterior fue restaurado.");
                } else {
                    toast.danger("No se pudo restaurar tu carrito anterior.");
                }
            }
        } finally {
            setActiveDirectProductId(null);
        }
    }

    async function startProductAction(product: Product, action: PendingProductAction) {
        if (isActionPending) return;
        if (!isAuthenticated) {
            toast.danger("Debes iniciar sesion para comprar");
            router.push("/login");
            return;
        }

        if (!canBuyProduct(product)) {
            toast.danger("Este producto no tiene stock");
            return;
        }

        const selectedVariant = selectedVariantByProduct[product.id];
        if (selectedVariant !== undefined) {
            if (action === "add") {
                await executeAddToCart(product, selectedVariant);
            } else {
                await executeDirectBuy(product, selectedVariant);
            }
            return;
        }

        setVariantLookup({ productId: product.id, action });
        try {
            const variants = await ensureVariants(product);
            if (variants.length === 0) {
                if (action === "add") {
                    await executeAddToCart(product);
                } else {
                    await executeDirectBuy(product);
                }
                return;
            }

            setVariantPicker({
                product,
                variants,
                action,
            });
            setVariantPickerSelectedId(variants[0].id);
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudieron cargar variantes";
            toast.danger(message);
        } finally {
            setVariantLookup(null);
        }
    }

    async function handleConfirmVariantPicker() {
        if (!variantPicker || variantPickerSelectedId === undefined) return;

        const product = variantPicker.product;
        const selectedVariant = variantPickerSelectedId;
        const action = variantPicker.action;

        setSelectedVariantByProduct((prev) => ({
            ...prev,
            [product.id]: selectedVariant,
        }));
        setVariantPicker(null);

        if (action === "add") {
            await executeAddToCart(product, selectedVariant);
        } else {
            await executeDirectBuy(product, selectedVariant);
        }
    }

    async function handleChangeQuantity(item: CartItem, nextQuantity: number) {
        const itemId = getCartItemId(item);
        const itemKey = String(itemId);
        const boundedQuantity = Math.max(0, nextQuantity);
        const maxStock = item.max_stock ?? item.stock;
        const quantity = typeof maxStock === "number" && maxStock > 0
            ? Math.min(boundedQuantity, maxStock)
            : boundedQuantity;

        setActiveCartItemId(itemKey);
        try {
            if (quantity <= 0) {
                await removeCartItem.mutateAsync({ tenantSlug, itemId });
                return;
            }
            await updateCartItem.mutateAsync({ tenantSlug, itemId, quantity });
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo actualizar el carrito";
            toast.danger(message);
        } finally {
            setActiveCartItemId(null);
        }
    }

    async function handleApplyCoupon() {
        if (!isAuthenticated) return;
        const code = couponCode.trim();
        if (!code) {
            toast.danger("Ingresa un codigo de cupon");
            return;
        }
        try {
            await applyCoupon.mutateAsync({ tenantSlug, code });
            toast.success("Cupon aplicado");
            setCouponCode("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo aplicar el cupon";
            toast.danger(message);
        }
    }

    async function handleRemoveCoupon() {
        if (!isAuthenticated) return;
        try {
            await removeCoupon.mutateAsync({ tenantSlug });
            toast.success("Cupon removido");
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo remover el cupon";
            toast.danger(message);
        }
    }

    async function handleCheckoutFromCart() {
        if (isCheckoutPending) return;
        if (!isAuthenticated) {
            toast.danger("Debes iniciar sesion para pagar");
            router.push("/login");
            return;
        }

        if (cartItems.length === 0) {
            toast.danger("Agrega productos al carrito primero");
            return;
        }
        if (hasBlockingCartWarnings) {
            toast.danger("Tu carrito tiene productos sin stock o no disponibles. Ajustalo antes de pagar.");
            return;
        }

        const payload = buildCheckoutPayload();
        if (!payload) return;

        try {
            const checkout = await createCheckout.mutateAsync({
                tenantSlug,
                payload,
            });
            toast.success("Compra iniciada.");

            if (checkout.payment_url) {
                window.location.href = checkout.payment_url;
                return;
            }
            toast.success(ORDER_CREATED_FALLBACK_MESSAGE);
            router.push("/perfil/me");
        } catch (error) {
            const message = error instanceof Error && error.message
                ? error.message
                : PAYMENT_START_ERROR;
            toast.danger(message);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Catalogo destacado</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-[22px] bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col gap-6 pt-4">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                    <p className="text-3xl mb-3">⚠️</p>
                    <p className="text-lg font-semibold text-[var(--foreground)]">No se pudo cargar el catalogo</p>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        Hubo un problema al consultar productos de esta tienda.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Catalogo destacado</h2>
                        {isAuthenticated && (
                            <span className="text-xs font-semibold rounded-full px-2 py-1 bg-[var(--surface-secondary)] border border-[var(--border)]">
                                Carrito: {cartItemCount}
                            </span>
                        )}
                    </div>
                    <Link href={`/marketplace?tenant=${tenantSlug}`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="font-semibold border-[var(--border)] hover:bg-[var(--surface-secondary)]"
                        >
                            Ver en marketplace
                        </Button>
                    </Link>
                </div>

                {products.length > 0 ? (
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {products.map((product) => {
                                const name = getProductName(product);
                                const image = getProductImage(product);
                                const available = canBuyProduct(product);
                                const selectedVariantId = selectedVariantByProduct[product.id];
                                const cachedVariants = variantsByProduct[product.id] ?? [];
                                const selectedVariant = cachedVariants.find((variant) => variant.id === selectedVariantId);

                                const isLookupAdd = variantLookup?.productId === product.id && variantLookup.action === "add";
                                const isLookupDirect = variantLookup?.productId === product.id && variantLookup.action === "direct";
                                const isPendingAdd = addCartItem.isPending && activeProductId === product.id;
                                const isPendingDirect = activeDirectProductId === product.id && (clearCart.isPending || addCartItem.isPending || createCheckout.isPending);

                                return (
                                    <Card
                                        key={product.id}
                                        className="overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
                                    >
                                        <Card.Content className="p-3 flex flex-col gap-3 h-full">
                                            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[var(--surface-secondary)]">
                                                {image ? (
                                                    <Image
                                                        src={image}
                                                        alt={name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">
                                                        📦
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 grow">
                                                <p className="line-clamp-2 text-sm font-semibold text-[var(--foreground)] min-h-10">
                                                    {name}
                                                </p>
                                                {product.short_description && (
                                                    <p className="line-clamp-2 text-xs text-[var(--muted)]">
                                                        {product.short_description}
                                                    </p>
                                                )}
                                                <p className="text-base font-extrabold text-[var(--accent)]">
                                                    {formatCLP(product.price)}
                                                </p>
                                                <p className="text-xs text-[var(--muted)]">
                                                    {available ? "Disponible" : "Sin stock"}
                                                </p>
                                                {selectedVariant && (
                                                    <p className="text-[11px] text-[var(--muted)]">
                                                        Variante: {getVariantLabel(selectedVariant)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                <Button
                                                    variant="primary"
                                                    className="w-full font-semibold"
                                                    isDisabled={!available || addCartItem.isPending || createCheckout.isPending || clearCart.isPending}
                                                    isPending={isPendingAdd || isLookupAdd}
                                                    onPress={() => startProductAction(product, "add")}
                                                >
                                                    {available ? "Agregar al carrito" : "Sin stock"}
                                                </Button>
                                                {available && (
                                                    <Button
                                                        variant="secondary"
                                                        className="w-full font-semibold"
                                                        isDisabled={addCartItem.isPending || createCheckout.isPending || clearCart.isPending}
                                                        isPending={isPendingDirect || isLookupDirect}
                                                        onPress={() => startProductAction(product, "direct")}
                                                    >
                                                        Comprar directo
                                                    </Button>
                                                )}
                                            </div>
                                        </Card.Content>
                                    </Card>
                                );
                            })}
                        </div>

                        {(hasPrevious || hasNext) && (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                                <p className="text-xs text-[var(--muted)]">
                                    Pagina {currentPage} de {totalPages}
                                    {typeof totalProducts === "number" ? ` · ${totalProducts} productos` : ""}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        isDisabled={!hasPrevious}
                                        onPress={() => setPage((value) => Math.max(1, value - 1))}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        isDisabled={!hasNext}
                                        onPress={() => setPage((value) => value + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm text-center">
                        <div className="size-16 bg-[var(--surface-tertiary)] rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                            📦
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Sin productos</h3>
                        <p className="text-[var(--muted)] max-w-sm">Esta comunidad aun no ha listado productos en el catalogo.</p>
                    </div>
                )}

                <Card className="border border-[var(--border)] bg-[var(--surface)]">
                    <Card.Content className="p-4 sm:p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-[var(--foreground)]">Carrito de la tienda</h3>
                            {isAuthenticated && (
                                <span className="text-xs text-[var(--muted)]">
                                    {cartItemCount} item{cartItemCount === 1 ? "" : "s"}
                                </span>
                            )}
                        </div>

                        {!isAuthenticated && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                <p className="text-sm font-semibold text-[var(--foreground)]">Inicia sesion para usar carrito</p>
                                <p className="text-xs text-[var(--muted)] mt-1">
                                    Podras agregar varios productos y pagar todo junto.
                                </p>
                                <Button variant="primary" className="mt-3" onPress={() => router.push("/login")}>
                                    Ir a login
                                </Button>
                            </div>
                        )}

                        {isAuthenticated && isCartLoading && (
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                                <p className="text-sm text-[var(--muted)]">Cargando carrito...</p>
                            </div>
                        )}

                        {isAuthenticated && isCartError && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                <p className="text-sm font-semibold text-[var(--foreground)]">No se pudo cargar el carrito</p>
                                <p className="text-xs text-[var(--muted)] mt-1">Intenta recargar la pagina.</p>
                            </div>
                        )}

                        {isAuthenticated && !isCartLoading && !isCartError && cartItems.length === 0 && (
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-center">
                                <p className="text-sm font-semibold text-[var(--foreground)]">Tu carrito esta vacio</p>
                                <p className="text-xs text-[var(--muted)] mt-1">Agrega productos para continuar al checkout.</p>
                            </div>
                        )}

                        {isAuthenticated && !isCartLoading && !isCartError && cartItems.length > 0 && (
                            <>
                                <div className="flex flex-col gap-2">
                                    {cartItems.map((item) => {
                                        const itemId = getCartItemId(item);
                                        const itemKey = String(itemId);
                                        const itemPending = activeCartItemId === itemKey && (updateCartItem.isPending || removeCartItem.isPending);
                                        const maxStock = item.max_stock ?? item.stock;
                                        const canIncrease = typeof maxStock === "number" ? item.quantity < maxStock : true;

                                        return (
                                            <div key={itemKey} className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                                            {getCartItemName(item)}
                                                        </p>
                                                        <p className="text-xs text-[var(--muted)] mt-0.5">
                                                            {formatCLP(getCartItemUnitPrice(item))} c/u
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-bold text-[var(--foreground)] shrink-0">
                                                        {formatCLP(getCartItemTotal(item))}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            isDisabled={itemPending || item.quantity <= 1}
                                                            onPress={() => handleChangeQuantity(item, item.quantity - 1)}
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            isDisabled={itemPending || !canIncrease}
                                                            onPress={() => handleChangeQuantity(item, item.quantity + 1)}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="tertiary"
                                                        className="text-red-500"
                                                        isDisabled={itemPending}
                                                        isPending={itemPending && removeCartItem.isPending}
                                                        onPress={() => handleChangeQuantity(item, 0)}
                                                    >
                                                        Quitar
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 space-y-2">
                                    {cart?.coupon && (
                                        <p className="text-xs text-[var(--muted)]">
                                            Cupón activo: <span className="font-semibold text-[var(--foreground)]">{cart.coupon.code}</span>
                                        </p>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            aria-label="Codigo de cupon"
                                            placeholder="Codigo de cupon"
                                            value={couponCode}
                                            onChange={(event) => setCouponCode(event.target.value)}
                                        />
                                        <Button
                                            variant="secondary"
                                            isPending={applyCoupon.isPending}
                                            isDisabled={isCouponPending}
                                            onPress={handleApplyCoupon}
                                        >
                                            Aplicar
                                        </Button>
                                        {cart?.coupon && (
                                            <Button
                                                variant="tertiary"
                                                isPending={removeCoupon.isPending}
                                                isDisabled={isCouponPending}
                                                onPress={handleRemoveCoupon}
                                            >
                                                Quitar
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {cartWarnings.length > 0 && (
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                                        <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Avisos del carrito</p>
                                        <div className="flex flex-col gap-1">
                                            {cartWarnings.map((warning, index) => (
                                                <p key={`${warning.type}-${index}`} className="text-xs text-[var(--muted)]">
                                                    • {warning.message}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider m-0">Entrega</p>
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                            {DELIVERY_OPTIONS.map((option) => (
                                                <Button
                                                    key={option.key}
                                                    size="sm"
                                                    variant={deliveryMethod === option.key ? "primary" : "secondary"}
                                                    isDisabled={isCheckoutPending}
                                                    onPress={() => setDeliveryMethod(option.key)}
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider m-0">Pago</p>
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                            {PAYMENT_OPTIONS.map((option) => (
                                                <Button
                                                    key={option.key}
                                                    size="sm"
                                                    variant={paymentMethod === option.key ? "primary" : "secondary"}
                                                    isDisabled={isCheckoutPending}
                                                    onPress={() => setPaymentMethod(option.key)}
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {deliveryMethod === "SHIPPING" && (
                                    <div className="space-y-2">
                                        <Input aria-label="Nombre" placeholder="Nombre completo" value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} disabled={isCheckoutPending} />
                                        <Input aria-label="Telefono" placeholder="Telefono" value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} disabled={isCheckoutPending} />
                                        <Input aria-label="Direccion" placeholder="Direccion" value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} disabled={isCheckoutPending} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input aria-label="Ciudad" placeholder="Ciudad" value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} disabled={isCheckoutPending} />
                                            <Input aria-label="Region" placeholder="Region" value={shipping.region} onChange={(event) => setShipping({ ...shipping, region: event.target.value })} disabled={isCheckoutPending} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input aria-label="Codigo postal" placeholder="Codigo postal (opcional)" value={shipping.postal_code} onChange={(event) => setShipping({ ...shipping, postal_code: event.target.value })} disabled={isCheckoutPending} />
                                            <Input aria-label="Pais" placeholder="Pais" value="Chile (CL)" readOnly disabled />
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--muted)]">Subtotal</span>
                                        <span className="font-semibold">{formatCLP(cartSubtotal)}</span>
                                    </div>
                                    {cartDiscount > 0 && (
                                        <div className="flex items-center justify-between text-sm mt-1">
                                            <span className="text-[var(--muted)]">Descuento</span>
                                            <span className="font-semibold text-[var(--success)]">- {formatCLP(cartDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-base mt-2 pt-2 border-t border-[var(--border)]">
                                        <span className="font-semibold">Total</span>
                                        <span className="font-extrabold text-[var(--accent)]">{formatCLP(cartTotal)}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full font-semibold"
                                    isPending={isCheckoutPending}
                                    isDisabled={cartItems.length === 0 || isCheckoutPending || hasBlockingCartWarnings}
                                    onPress={handleCheckoutFromCart}
                                >
                                    Ir al pago
                                </Button>
                                {hasBlockingCartWarnings && (
                                    <p className="text-xs text-amber-500">
                                        Hay productos sin stock o no disponibles en tu carrito. Ajusta el carrito para continuar.
                                    </p>
                                )}
                            </>
                        )}
                    </Card.Content>
                </Card>
            </div>

            {variantPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <button
                        type="button"
                        aria-label="Cerrar selector de variantes"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setVariantPicker(null)}
                    />
                    <Card className="w-full max-w-md mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <Card.Content className="p-5 space-y-4">
                            <h4 className="text-lg font-bold text-[var(--foreground)]">Selecciona variante</h4>
                            <p className="text-sm text-[var(--muted)]">{getProductName(variantPicker.product)}</p>

                            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                                {variantPicker.variants.map((variant) => (
                                    <Button
                                        key={String(variant.id)}
                                        variant={variantPickerSelectedId === variant.id ? "primary" : "secondary"}
                                        className="justify-start"
                                        isDisabled={isActionPending}
                                        onPress={() => setVariantPickerSelectedId(variant.id)}
                                    >
                                        {getVariantLabel(variant)}
                                    </Button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="tertiary" className="flex-1" isDisabled={isActionPending} onPress={() => setVariantPicker(null)}>
                                    Cancelar
                                </Button>
                                <Button variant="primary" className="flex-1" isDisabled={isActionPending} isPending={isActionPending} onPress={handleConfirmVariantPicker}>
                                    Confirmar
                                </Button>
                            </div>
                        </Card.Content>
                    </Card>
                </div>
            )}
        </>
    );
}
