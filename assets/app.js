import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = supabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const fmt = n => `PKR ${Number(n||0).toLocaleString('en-PK')}`;
const FALLBACK_PRODUCTS = [
  {id:'p1',name:'NOIR ESSENTIAL BLACK TEE',price:3490,image_url:'assets/images/product1.jpg',stock:20,is_active:true,sort_order:1},
  {id:'p2',name:'HERITAGE OLIVE TEE',price:3490,image_url:'assets/images/product2.jpg',stock:20,is_active:true,sort_order:2},
  {id:'p3',name:'SAHARA SAND TEE',price:3490,image_url:'assets/images/product3.jpg',stock:20,is_active:true,sort_order:3},
  {id:'p4',name:'GRAPHITE CHARCOAL TEE',price:3490,image_url:'assets/images/product4.jpg',stock:20,is_active:true,sort_order:4},
  {id:'p5',name:'PURE IVORY TEE',price:3490,image_url:'assets/images/product5.jpg',stock:20,is_active:true,sort_order:5},
  {id:'p6',name:'LEGACY BACK PRINT TEE',price:3990,image_url:'assets/images/product6.jpg',stock:20,is_active:true,sort_order:6}
];
let products=[...FALLBACK_PRODUCTS];
let cart=JSON.parse(localStorage.getItem('nazarya-cart')||'[]');

const $=s=>document.querySelector(s);
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}

async function loadSite(){
  if(!supabase){renderProducts();renderCart();return;}
  const [{data:p,error:pe},{data:s,error:se}] = await Promise.all([
    supabase.from('products').select('*').eq('is_active',true).order('sort_order'),
    supabase.from('site_settings').select('*').eq('id','main').maybeSingle()
  ]);
  if(!pe && p?.length) products=p;
  if(!se && s) applySettings(s);
  renderProducts();renderCart();
}
function applySettings(s){
  if(s.announcement) $('#announcement').textContent=s.announcement;
  const title=(s.hero_title||'WEAR YOUR IDENTITY').trim().split(/\s+/); const cut=Math.max(1,Math.ceil(title.length/2));
  $('#heroTitle1').textContent=title.slice(0,cut).join(' '); $('#heroTitle2').textContent=title.slice(cut).join(' ')||'IDENTITY';
  if(s.hero_subtitle) $('#heroSubtitle').textContent=s.hero_subtitle;
  if(s.hero_button_text) $('#heroButton').textContent=s.hero_button_text;
  if(s.hero_button_link) $('#heroButton').setAttribute('href',s.hero_button_link);
  if(s.hero_image_url) $('#heroMedia').style.backgroundImage=`url("${s.hero_image_url}")`;
  if(s.about_title) $('#aboutTitle').textContent=s.about_title;
  if(s.about_text) $('#aboutText').textContent=s.about_text;
  if(s.instagram_handle) $('#instagramHandle').textContent=s.instagram_handle;
}
function renderProducts(){
  $('#productsGrid').innerHTML=products.map(p=>`<article class="product-card"><div class="product-image-wrap"><img src="${p.image_url||'assets/images/product1.jpg'}" alt="${p.name}"><button class="quick-add" data-add="${p.id}">ADD TO BAG</button></div><div class="product-name">${p.name}</div><div class="product-price">${fmt(p.price)}</div></article>`).join('');
}
function saveCart(){localStorage.setItem('nazarya-cart',JSON.stringify(cart));renderCart()}
function addToCart(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;const found=cart.find(x=>String(x.id)===String(id));if(found)found.qty+=1;else cart.push({...p,qty:1});saveCart();openCart();toast('Added to bag')}
function renderCart(){
  $('#cartCount').textContent=cart.reduce((a,b)=>a+b.qty,0);
  $('#cartItems').innerHTML=cart.length?cart.map(i=>`<div class="cart-item"><img src="${i.image_url}" alt="${i.name}"><div><h4>${i.name}</h4><p>${fmt(i.price)}</p><div class="qty"><button data-dec="${i.id}">−</button><span>${i.qty}</span><button data-inc="${i.id}">+</button></div></div><button class="remove" data-remove="${i.id}">REMOVE</button></div>`).join(''):'<p style="color:#aaa;font-size:12px">Your bag is empty.</p>';
  $('#cartTotal').textContent=fmt(cart.reduce((a,b)=>a+b.price*b.qty,0));
}
function openCart(){ $('#backdrop').classList.add('open');$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false') }
function closeCart(){ $('#backdrop').classList.remove('open');$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true') }

document.addEventListener('click',e=>{
  const add=e.target.closest('[data-add]');if(add)addToCart(add.dataset.add);
  const inc=e.target.closest('[data-inc]');if(inc){cart.find(x=>String(x.id)===String(inc.dataset.inc)).qty++;saveCart()}
  const dec=e.target.closest('[data-dec]');if(dec){const i=cart.find(x=>String(x.id)===String(dec.dataset.dec));i.qty--;if(i.qty<=0)cart=cart.filter(x=>String(x.id)!==String(i.id));saveCart()}
  const rem=e.target.closest('[data-remove]');if(rem){cart=cart.filter(x=>String(x.id)!==String(rem.dataset.remove));saveCart()}
});
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=closeCart;$('#backdrop').onclick=closeCart;
$('#checkoutBtn').onclick=()=>{if(!cart.length)return toast('Your bag is empty');closeCart();$('#checkoutModal').classList.add('open')};
$('#closeCheckout').onclick=()=>$('#checkoutModal').classList.remove('open');
$('#searchBtn').onclick=()=>{const q=prompt('Search products');if(!q)return;const m=products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));if(!m.length)return toast('No product found');document.querySelector(`[data-add="${m[0].id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'})};
$('#newsletterForm').onsubmit=async e=>{e.preventDefault();const email=$('#newsletterEmail').value.trim();if(supabase){const {error}=await supabase.from('newsletter').insert({email});if(error && !error.message.toLowerCase().includes('duplicate')) return toast(error.message)}e.target.reset();toast('Thank you for subscribing')};
$('#checkoutForm').onsubmit=async e=>{
  e.preventDefault(); const fd=new FormData(e.target); const subtotal=cart.reduce((a,b)=>a+b.price*b.qty,0); const shipping=subtotal>=5000?0:250; const order={customer_name:fd.get('customer_name'),phone:fd.get('phone'),email:fd.get('email')||null,city:fd.get('city'),address:fd.get('address'),payment_method:fd.get('payment_method'),subtotal,shipping,total:subtotal+shipping,status:'new',items:cart.map(({id,name,price,qty,image_url})=>({id,name,price,qty,image_url}))};
  if(!supabase){return toast('Connect Supabase first to receive orders')}
  const {data,error}=await supabase.from('orders').insert(order).select('order_number').single();
  if(error)return toast(error.message);
  cart=[];saveCart();e.target.reset();$('#checkoutModal').classList.remove('open');toast(`Order ${data.order_number} placed successfully`);
};
loadSite();
