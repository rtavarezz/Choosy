import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TinderCard from 'react-tinder-card';
import { AnimatePresence, motion } from 'framer-motion';

// Mock event data organized by topic and group size
const MOCK_EVENTS: Record<string, Record<string, any[]>> = {
  concerts: {
    solo: [
      {
        id: '1',
        name: 'Taylor Swift Concert',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '8:00 PM - 11:00 PM',
        reviews: { stars: 4.8, count: 1247 },
        contact: { phone: '(555) 123-4567', email: 'info@madisonsquaregarden.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Jazz Night at Blue Note',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:00 PM',
        reviews: { stars: 4.6, count: 892 },
        contact: { phone: '(555) 234-5678', email: 'reservations@bluenote.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Rock Concert at Central Park',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        hours: '6:00 PM - 9:00 PM',
        reviews: { stars: 4.5, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'info@centralpark.com' },
        voters: ['friendA']
      },
      {
        id: '4',
        name: 'Classical Symphony',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '7:30 PM - 10:30 PM',
        reviews: { stars: 4.7, count: 1234 },
        contact: { phone: '(555) 456-7890', email: 'symphony@classical.com' },
        voters: ['friendC']
      },
      {
        id: '5',
        name: 'Indie Rock Show',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        hours: '9:00 PM - 12:00 AM',
        reviews: { stars: 4.4, count: 456 },
        contact: { phone: '(555) 567-8901', email: 'indie@rock.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Jazz Duo',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        hours: '8:00 PM - 11:00 PM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 234-5678', email: 'reservations@romanticjazz.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Acoustic Love Songs',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '7:30 PM - 10:30 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 345-6789', email: 'info@acousticlove.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Piano Bar Duet',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        hours: '6:00 PM - 9:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'piano@bar.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '4',
        name: 'Smooth Jazz Evening',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '8:30 PM - 11:30 PM',
        reviews: { stars: 4.8, count: 789 },
        contact: { phone: '(555) 567-8901', email: 'jazz@smooth.com' },
        voters: ['friendC']
      },
      {
        id: '5',
        name: 'Romantic Guitar Duo',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 678-9012', email: 'guitar@romantic.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Rock Festival in Central Park',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        hours: '6:00 PM - 11:00 PM',
        reviews: { stars: 4.4, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'events@centralpark.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Pop Concert at Stadium',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:30 PM',
        reviews: { stars: 4.6, count: 1234 },
        contact: { phone: '(555) 456-7890', email: 'tickets@stadium.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '3',
        name: 'Indie Music Festival',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        hours: '5:00 PM - 10:00 PM',
        reviews: { stars: 4.3, count: 456 },
        contact: { phone: '(555) 567-8901', email: 'indie@festival.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Country Music Night',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '8:00 PM - 11:00 PM',
        reviews: { stars: 4.5, count: 678 },
        contact: { phone: '(555) 678-9012', email: 'country@night.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '5',
        name: 'Electronic Dance Music',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        hours: '9:00 PM - 2:00 AM',
        reviews: { stars: 4.7, count: 890 },
        contact: { phone: '(555) 789-0123', email: 'edm@electronic.com' },
        voters: ['friendB', 'friendC']
      }
    ]
  },
  datenight: {
    solo: [
      {
        id: '1',
        name: 'Self-Care Spa Day',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
        hours: '10:00 AM - 6:00 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 123-4567', email: 'spa@wellness.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Solo Art Workshop',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
        hours: '2:00 PM - 5:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'art@workshop.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Wine Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '4:00 PM - 7:00 PM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 345-6789', email: 'wine@solo.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Cooking Class',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '6:00 PM - 9:00 PM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'cooking@solo.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Movie Night',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
        hours: '7:30 PM - 10:30 PM',
        reviews: { stars: 4.3, count: 567 },
        contact: { phone: '(555) 567-8901', email: 'movie@solo.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Candlelit Dinner',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.9, count: 789 },
        contact: { phone: '(555) 345-6789', email: 'reservations@romanticdinner.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Couples Massage',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
        hours: '2:00 PM - 4:00 PM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 456-7890', email: 'massage@couples.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Sunset Rooftop Drinks',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '5:00 PM - 8:00 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 567-8901', email: 'drinks@rooftop.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '4',
        name: 'Romantic Movie Night',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
        hours: '7:30 PM - 10:30 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 678-9012', email: 'movie@romantic.com' },
        voters: ['friendC']
      },
      {
        id: '5',
        name: 'Couples Art Class',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
        hours: '3:00 PM - 6:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 789-0123', email: 'art@couples.com' },
        voters: ['friendA', 'friendC']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Cooking Class',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '6:00 PM - 9:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 678-9012', email: 'cooking@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Wine Tasting Experience',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 789-0123', email: 'wine@tasting.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '3',
        name: 'Group Game Night',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.5, count: 345 },
        contact: { phone: '(555) 890-1234', email: 'games@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Movie Night',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
        hours: '7:30 PM - 11:30 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 901-2345', email: 'movie@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '5',
        name: 'Group Art Workshop',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
        hours: '2:00 PM - 5:00 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 012-3456', email: 'art@group.com' },
        voters: ['friendA', 'friendC']
      }
    ]
  },
  foodie: {
    solo: [
      {
        id: '1',
        name: 'Food Truck Festival',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '11:00 AM - 8:00 PM',
        reviews: { stars: 4.5, count: 1234 },
        contact: { phone: '(555) 123-4567', email: 'info@foodtruckfest.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Solo Ramen Adventure',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '6:00 PM - 9:00 PM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 234-5678', email: 'ramen@solo.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Pizza Night',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:00 PM',
        reviews: { stars: 4.4, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'pizza@solo.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Ice Cream Tour',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '2:00 PM - 5:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 456-7890', email: 'icecream@solo.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Coffee Crawl',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '9:00 AM - 12:00 PM',
        reviews: { stars: 4.3, count: 123 },
        contact: { phone: '(555) 567-8901', email: 'coffee@solo.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Sushi Master',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.9, count: 2341 },
        contact: { phone: '(555) 678-9012', email: 'reservations@sushimaster.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Farm-to-Table Bistro',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '5:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 892 },
        contact: { phone: '(555) 789-0123', email: 'hello@farmtable.com' },
        voters: ['friendA']
      },
      {
        id: '3',
        name: 'Romantic Italian Dinner',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '6:30 PM - 10:30 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 890-1234', email: 'italian@romantic.com' },
        voters: ['friendB']
      },
      {
        id: '4',
        name: 'Couples Cooking Class',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '4:00 PM - 7:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 901-2345', email: 'cooking@couples.com' },
        voters: ['friendC']
      },
      {
        id: '5',
        name: 'Dessert Date Night',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '8:00 PM - 11:00 PM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 012-3456', email: 'dessert@date.com' },
        voters: ['friendA']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group BBQ Experience',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '4:00 PM - 9:00 PM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 890-1234', email: 'bbq@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Group Pizza Party',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 901-2345', email: 'pizza@group.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Group Taco Night',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '7:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 012-3456', email: 'tacos@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Sushi Feast',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '6:30 PM - 10:30 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 123-4567', email: 'sushi@group.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '5',
        name: 'Group Burger Bash',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '5:00 PM - 9:00 PM',
        reviews: { stars: 4.4, count: 123 },
        contact: { phone: '(555) 234-5678', email: 'burger@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  },
  nightlife: {
    solo: [
      {
        id: '1',
        name: 'Solo Bar Hopping',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '8:00 PM - 2:00 AM',
        reviews: { stars: 4.3, count: 234 },
        contact: { phone: '(555) 123-4567', email: 'info@solobar.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Cocktail Lounge',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 1:00 AM',
        reviews: { stars: 4.6, count: 456 },
        contact: { phone: '(555) 234-5678', email: 'cocktails@lounge.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Wine Bar Experience',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 12:00 AM',
        reviews: { stars: 4.4, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'wine@bar.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Speakeasy Night',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '9:00 PM - 2:00 AM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 456-7890', email: 'speakeasy@night.com' },
        voters: ['friendA']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Skyline Rooftop Bar',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 2:00 AM',
        reviews: { stars: 4.7, count: 1567 },
        contact: { phone: '(555) 456-7890', email: 'reservations@skylinebar.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Jazz Club Date Night',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 11:00 PM',
        reviews: { stars: 4.8, count: 789 },
        contact: { phone: '(555) 567-8901', email: 'jazz@club.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Craft Beer Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:30 PM - 10:30 PM',
        reviews: { stars: 4.5, count: 456 },
        contact: { phone: '(555) 678-9012', email: 'beer@craft.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Salsa Dancing Night',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '8:00 PM - 12:00 AM',
        reviews: { stars: 4.6, count: 678 },
        contact: { phone: '(555) 789-0123', email: 'salsa@dancing.com' },
        voters: ['friendA', 'friendC']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Underground Club',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '10:00 PM - 4:00 AM',
        reviews: { stars: 4.3, count: 723 },
        contact: { phone: '(555) 567-8901', email: 'info@undergroundclub.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '2',
        name: 'Group Karaoke Night',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '8:00 PM - 2:00 AM',
        reviews: { stars: 4.5, count: 456 },
        contact: { phone: '(555) 678-9012', email: 'karaoke@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '3',
        name: 'Group Pub Crawl',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 1:00 AM',
        reviews: { stars: 4.4, count: 345 },
        contact: { phone: '(555) 789-0123', email: 'pubcrawl@group.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '4',
        name: 'Group Comedy Night',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '9:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 890-1234', email: 'comedy@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '5',
        name: 'Group Dance Party',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '10:00 PM - 3:00 AM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 901-2345', email: 'dance@group.com' },
        voters: ['friendA', 'friendB']
      }
    ]
  },
  parks: {
    solo: [
      {
        id: '1',
        name: 'Solo Hiking Trail',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '9:00 AM - 5:00 PM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 123-4567', email: 'info@hikingtrail.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Peaceful Garden Walk',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '8:00 AM - 6:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'info@gardenwalk.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Bird Watching',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '7:00 AM - 11:00 AM',
        reviews: { stars: 4.3, count: 123 },
        contact: { phone: '(555) 345-6789', email: 'birdwatching@solo.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Photography Walk',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '4:00 PM - 8:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'photography@solo.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Meditation Spot',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '6:00 AM - 10:00 AM',
        reviews: { stars: 4.8, count: 234 },
        contact: { phone: '(555) 567-8901', email: 'meditation@solo.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Park Picnic',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '12:00 PM - 4:00 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'picnic@park.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Couples Nature Trail',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '10:00 AM - 2:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'trail@nature.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Romantic Sunset View',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '5:00 PM - 8:00 PM',
        reviews: { stars: 4.9, count: 456 },
        contact: { phone: '(555) 567-8901', email: 'sunset@romantic.com' },
        voters: ['friendA']
      },
      {
        id: '4',
        name: 'Couples Bike Ride',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '9:00 AM - 1:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 678-9012', email: 'bike@couples.com' },
        voters: ['friendC']
      },
      {
        id: '5',
        name: 'Romantic Lake Walk',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '3:00 PM - 6:00 PM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 789-0123', email: 'lake@romantic.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Park Games',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '2:00 PM - 6:00 PM',
        reviews: { stars: 4.4, count: 234 },
        contact: { phone: '(555) 567-8901', email: 'games@park.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Group Hiking Adventure',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '9:00 AM - 3:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 678-9012', email: 'hiking@group.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Group Picnic Party',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '12:00 PM - 5:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 789-0123', email: 'picnic@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Sports Day',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '10:00 AM - 4:00 PM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 890-1234', email: 'sports@group.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '5',
        name: 'Group Nature Photography',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '4:00 PM - 8:00 PM',
        reviews: { stars: 4.8, count: 234 },
        contact: { phone: '(555) 901-2345', email: 'photography@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  },
  sports: {
    solo: [
      {
        id: '1',
        name: 'Solo Tennis Session',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '9:00 AM - 11:00 AM',
        reviews: { stars: 4.6, count: 123 },
        contact: { phone: '(555) 123-4567', email: 'tennis@solo.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Solo Basketball Practice',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '6:00 PM - 8:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'basketball@solo.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Swimming Laps',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '7:00 AM - 9:00 AM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'swimming@solo.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Golf Round',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '8:00 AM - 12:00 PM',
        reviews: { stars: 4.4, count: 123 },
        contact: { phone: '(555) 456-7890', email: 'golf@solo.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Rock Climbing',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '2:00 PM - 5:00 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 567-8901', email: 'climbing@solo.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Couples Tennis Match',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '6:00 PM - 8:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'tennis@couples.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '2',
        name: 'Couples Golf Date',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '9:00 AM - 1:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'golf@couples.com' },
        voters: ['friendC']
      },
      {
        id: '3',
        name: 'Couples Rock Climbing',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '3:00 PM - 6:00 PM',
        reviews: { stars: 4.8, count: 234 },
        contact: { phone: '(555) 456-7890', email: 'climbing@couples.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '4',
        name: 'Couples Swimming',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '4:00 PM - 7:00 PM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 567-8901', email: 'swimming@couples.com' },
        voters: ['friendB']
      },
      {
        id: '5',
        name: 'Couples Basketball',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '7:00 PM - 9:00 PM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 678-9012', email: 'basketball@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Basketball Tournament',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '3:00 PM - 7:00 PM',
        reviews: { stars: 4.5, count: 456 },
        contact: { phone: '(555) 345-6789', email: 'basketball@tournament.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Group Tennis Tournament',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '10:00 AM - 4:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 456-7890', email: 'tennis@tournament.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Group Golf Outing',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '8:00 AM - 2:00 PM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 567-8901', email: 'golf@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Rock Climbing',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '2:00 PM - 6:00 PM',
        reviews: { stars: 4.8, count: 234 },
        contact: { phone: '(555) 678-9012', email: 'climbing@group.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '5',
        name: 'Group Swimming Meet',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '5:00 PM - 8:00 PM',
        reviews: { stars: 4.4, count: 123 },
        contact: { phone: '(555) 789-0123', email: 'swimming@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  },
  gokart: {
    solo: [
      {
        id: '1',
        name: 'Solo Go Kart Racing',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        hours: '10:00 AM - 6:00 PM',
        reviews: { stars: 4.4, count: 234 },
        contact: { phone: '(555) 123-4567', email: 'racing@gokart.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Solo Drift Racing',
        image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
        hours: '11:00 AM - 7:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 234-5678', email: 'drift@gokart.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Speed Racing',
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
        hours: '9:00 AM - 5:00 PM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 345-6789', email: 'speed@gokart.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Endurance Race',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        hours: '12:00 PM - 8:00 PM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 456-7890', email: 'endurance@gokart.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Time Trial',
        image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
        hours: '2:00 PM - 6:00 PM',
        reviews: { stars: 4.3, count: 234 },
        contact: { phone: '(555) 567-8901', email: 'timetrial@gokart.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Couples Go Kart Race',
        image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
        hours: '2:00 PM - 8:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 234-5678', email: 'couples@gokart.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '2',
        name: 'Couples Drift Competition',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        hours: '3:00 PM - 9:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 345-6789', email: 'drift@couples.com' },
        voters: ['friendC']
      },
      {
        id: '3',
        name: 'Couples Speed Challenge',
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
        hours: '1:00 PM - 7:00 PM',
        reviews: { stars: 4.5, count: 456 },
        contact: { phone: '(555) 456-7890', email: 'speed@couples.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '4',
        name: 'Couples Endurance Race',
        image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
        hours: '4:00 PM - 10:00 PM',
        reviews: { stars: 4.8, count: 345 },
        contact: { phone: '(555) 567-8901', email: 'endurance@couples.com' },
        voters: ['friendB']
      },
      {
        id: '5',
        name: 'Couples Time Trial',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        hours: '5:00 PM - 9:00 PM',
        reviews: { stars: 4.4, count: 123 },
        contact: { phone: '(555) 678-9012', email: 'timetrial@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Go Kart Championship',
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
        hours: '1:00 PM - 9:00 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'championship@gokart.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Group Drift Championship',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        hours: '2:00 PM - 10:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 456-7890', email: 'drift@championship.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Group Speed Championship',
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
        hours: '12:00 PM - 8:00 PM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 567-8901', email: 'speed@championship.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Endurance Championship',
        image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
        hours: '3:00 PM - 11:00 PM',
        reviews: { stars: 4.9, count: 456 },
        contact: { phone: '(555) 678-9012', email: 'endurance@championship.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '5',
        name: 'Group Time Trial Championship',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        hours: '4:00 PM - 10:00 PM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 789-0123', email: 'timetrial@championship.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  },
  swimming: {
    solo: [
      {
        id: '1',
        name: 'Solo Swim Session',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '7:00 AM - 9:00 AM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 123-4567', email: 'swim@solo.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Solo Lap Swimming',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '6:00 AM - 8:00 AM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'laps@solo.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Water Aerobics',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '10:00 AM - 11:00 AM',
        reviews: { stars: 4.4, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'aerobics@solo.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Diving Practice',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '2:00 PM - 4:00 PM',
        reviews: { stars: 4.7, count: 123 },
        contact: { phone: '(555) 456-7890', email: 'diving@solo.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Water Polo',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '5:00 PM - 7:00 PM',
        reviews: { stars: 4.3, count: 234 },
        contact: { phone: '(555) 567-8901', email: 'polo@solo.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Couples Pool Day',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '12:00 PM - 4:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'pool@couples.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '2',
        name: 'Couples Lap Swimming',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 8:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'laps@couples.com' },
        voters: ['friendC']
      },
      {
        id: '3',
        name: 'Couples Water Aerobics',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '9:00 AM - 10:00 AM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 456-7890', email: 'aerobics@couples.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '4',
        name: 'Couples Diving',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '3:00 PM - 5:00 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 567-8901', email: 'diving@couples.com' },
        voters: ['friendB']
      },
      {
        id: '5',
        name: 'Couples Water Polo',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '4:00 PM - 6:00 PM',
        reviews: { stars: 4.4, count: 234 },
        contact: { phone: '(555) 678-9012', email: 'polo@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Pool Party',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '2:00 PM - 8:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'party@pool.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Group Lap Swimming',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '6:00 AM - 8:00 AM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 456-7890', email: 'laps@group.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Group Water Aerobics',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '10:00 AM - 11:00 AM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 567-8901', email: 'aerobics@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Diving Competition',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '3:00 PM - 6:00 PM',
        reviews: { stars: 4.8, count: 234 },
        contact: { phone: '(555) 678-9012', email: 'diving@group.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '5',
        name: 'Group Water Polo Match',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '5:00 PM - 8:00 PM',
        reviews: { stars: 4.4, count: 123 },
        contact: { phone: '(555) 789-0123', email: 'polo@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  },
  drinks: {
    solo: [
      {
        id: '1',
        name: 'Solo Craft Beer Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '5:00 PM - 9:00 PM',
        reviews: { stars: 4.4, count: 123 },
        contact: { phone: '(555) 123-4567', email: 'beer@solo.com' },
        voters: ['friendA']
      },
      {
        id: '2',
        name: 'Solo Wine Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'wine@solo.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Solo Cocktail Making',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 11:00 PM',
        reviews: { stars: 4.5, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'cocktails@solo.com' },
        voters: ['friendC']
      },
      {
        id: '4',
        name: 'Solo Whiskey Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '8:00 PM - 12:00 AM',
        reviews: { stars: 4.7, count: 123 },
        contact: { phone: '(555) 456-7890', email: 'whiskey@solo.com' },
        voters: ['friendA']
      },
      {
        id: '5',
        name: 'Solo Tequila Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:30 PM - 10:30 PM',
        reviews: { stars: 4.3, count: 234 },
        contact: { phone: '(555) 567-8901', email: 'tequila@solo.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Couples Wine Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 234-5678', email: 'wine@couples.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '2',
        name: 'Couples Craft Beer Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 345-6789', email: 'beer@couples.com' },
        voters: ['friendC']
      },
      {
        id: '3',
        name: 'Couples Cocktail Making',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '8:00 PM - 12:00 AM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'cocktails@couples.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '4',
        name: 'Couples Whiskey Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:30 PM - 10:30 PM',
        reviews: { stars: 4.9, count: 123 },
        contact: { phone: '(555) 567-8901', email: 'whiskey@couples.com' },
        voters: ['friendB']
      },
      {
        id: '5',
        name: 'Couples Tequila Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:30 PM - 11:30 PM',
        reviews: { stars: 4.5, count: 456 },
        contact: { phone: '(555) 678-9012', email: 'tequila@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Cocktail Night',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 345-6789', email: 'cocktails@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Group Wine Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.7, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'wine@group.com' },
        voters: ['friendA', 'friendB']
      },
      {
        id: '3',
        name: 'Group Craft Beer Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '8:00 PM - 12:00 AM',
        reviews: { stars: 4.5, count: 123 },
        contact: { phone: '(555) 567-8901', email: 'beer@group.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '4',
        name: 'Group Whiskey Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:30 PM - 10:30 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 678-9012', email: 'whiskey@group.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '5',
        name: 'Group Tequila Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:30 PM - 11:30 PM',
        reviews: { stars: 4.4, count: 234 },
        contact: { phone: '(555) 789-0123', email: 'tequila@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  }
};

// Mock friend data for avatar display
const MOCK_FRIENDS = {
  friendA: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face' },
  friendB: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
  friendC: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
};

export default function VotePage() {
  const router = useRouter();
  const { planId, topic, groupSize, zip } = router.query;
  const [events, setEvents] = useState([]);
  const [voted, setVoted] = useState({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({}); // Track vote counts for each event
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  
  // New state for voter tracking
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [completedVoters, setCompletedVoters] = useState(0);
  const [voterId, setVoterId] = useState('');
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);

  // Load events based on topic and group size
  useEffect(() => {
    const topicStr = Array.isArray(topic) ? topic[0] : topic;
    const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
    
    if (topicStr && groupSizeStr && MOCK_EVENTS[topicStr] && MOCK_EVENTS[topicStr][groupSizeStr]) {
      let eventsToShow = MOCK_EVENTS[topicStr][groupSizeStr];
      
      // For demo, limit to 2 events and blur details
      if (planId === 'demo') {
        eventsToShow = eventsToShow.slice(0, 2).map(event => ({
          ...event,
          isDemo: true,
          // Blur contact info for demo
          contact: {
            phone: '***-***-****',
            email: 'demo@example.com'
          },
          // Blur hours for demo
          hours: 'Demo Hours',
          // Blur reviews for demo
          reviews: { stars: 0, count: 0 }
        }));
      }
      
      setEvents(eventsToShow);
      
      // Set expected voters based on group size
      const voterCount = groupSizeStr === 'solo' ? 1 : groupSizeStr === 'date' ? 2 : 5;
      setExpectedVoters(voterCount);
    }
  }, [topic, groupSize, planId]);

  // Load vote counts from localStorage
  useEffect(() => {
    const storedVotes = localStorage.getItem(`votes_${planId}`);
    if (storedVotes) {
      setVoteCounts(JSON.parse(storedVotes));
    }
    
    // Load completed voters count
    const storedCompletedVoters = localStorage.getItem(`completed_voters_${planId}`);
    if (storedCompletedVoters) {
      setCompletedVoters(parseInt(storedCompletedVoters));
    }
  }, [planId]);

  // Generate unique voter ID on mount
  useEffect(() => {
    if (!voterId) {
      const newVoterId = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setVoterId(newVoterId);
    }
  }, [voterId]);

  // Check if all voters have completed
  useEffect(() => {
    if (completedVoters >= expectedVoters) {
      setAllVotersCompleted(true);
    }
  }, [completedVoters, expectedVoters]);

  // Live refresh to check for new completed voters
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Check for updated completed voters count
      const storedCompletedVoters = localStorage.getItem(`completed_voters_${planId}`);
      if (storedCompletedVoters) {
        const newCompletedCount = parseInt(storedCompletedVoters);
        if (newCompletedCount !== completedVoters) {
          setCompletedVoters(newCompletedCount);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(refreshInterval);
  }, [planId, completedVoters]);

  // Timer countdown - redirects to results when time expires
  useEffect(() => {
    // Stop timer if voting is complete
    if (currentIndex >= events.length) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/results/${planId}`);
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [planId, router, currentIndex, events.length]);

  // Handle swipe gestures
  const swiped = (dir, eventId) => {
    setVoted(prev => ({ ...prev, [eventId]: dir === 'right' }));
    
    // Get current vote counts from localStorage
    const storedVotes = localStorage.getItem(`votes_${planId}`);
    const currentVotes = storedVotes ? JSON.parse(storedVotes) : {};
    
    // Update vote count for this event
    const currentCount = currentVotes[eventId] || 0;
    const newCount = dir === 'right' 
      ? currentCount + 1  // Approve: +1
      : Math.max(0, currentCount - 1); // Deny: -1, but minimum 0
    
    // Save updated votes to localStorage
    const updatedVotes = {
      ...currentVotes,
      [eventId]: newCount
    };
    localStorage.setItem(`votes_${planId}`, JSON.stringify(updatedVotes));
    
    // Update local state
    setVoteCounts(updatedVotes);
    
    setCurrentIndex(prev => prev + 1);
    
    // Check if this voter has completed all events
    if (currentIndex + 1 >= events.length) {
      // Mark this voter as completed
      const storedCompletedVoters = localStorage.getItem(`completed_voters_${planId}`);
      const currentCompleted = storedCompletedVoters ? parseInt(storedCompletedVoters) : 0;
      const newCompleted = currentCompleted + 1;
      
      localStorage.setItem(`completed_voters_${planId}`, newCompleted.toString());
      setCompletedVoters(newCompleted);
      
      // Store this voter's completion status
      localStorage.setItem(`voter_completed_${planId}_${voterId}`, 'true');
    }
  };

  // Manual swipe controls
  const handleManualSwipe = (dir) => {
    if (currentIndex < events.length) {
      const currentEvent = events[currentIndex];
      swiped(dir, currentEvent.id);
    }
  };

  // Get winning event for results page
  const getWinningEvent = () => {
    // Get all events with their vote counts
    const eventsWithVotes = events.map(event => ({
      ...event,
      voteCount: voteCounts[event.id] || 0
    }));
    
    // Sort by vote count (highest first)
    eventsWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    
    // Check for clear winner (more than 50% of total votes)
    const totalVotes = Object.values(voteCounts).reduce((sum: number, count: any) => sum + (count as number), 0);
    const highestVoteCount = eventsWithVotes[0]?.voteCount || 0;
    
    if (totalVotes > 0 && highestVoteCount > totalVotes / 2) {
      // Clear winner exists
      return eventsWithVotes[0];
    }
    
    // No clear winner - return top voted event (for now)
    // In the future, this could trigger a new voting round with top 33%
    return eventsWithVotes[0] || events[0] || null;
  };

  // Handle tie-breaking (for future implementation)
  const handleTieBreak = () => {
    // Get events sorted by vote count
    const eventsWithVotes = events.map(event => ({
      ...event,
      voteCount: voteCounts[event.id] || 0
    }));
    
    // Sort by vote count (highest first)
    eventsWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    
    // Get top 33% of events
    const topThirdCount = Math.ceil(eventsWithVotes.length / 3);
    const topEvents = eventsWithVotes.slice(0, topThirdCount);
    
    // In a real implementation, this would start a new voting round
    // with just the top events
    console.log('Tie detected - would start new round with:', topEvents);
    
    return topEvents[0]; // Return the highest voted event for now
  };

  // Format time display (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Render star rating
  const renderStars = (stars) => {
    return '⭐'.repeat(Math.floor(stars)) + '☆'.repeat(5 - Math.floor(stars));
  };

  // Handle login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.trim() && voterPhone.trim()) {
      setIsAuthenticated(true);
      setShowLogin(false);
      // Store voter info in localStorage for anonymous voting
      localStorage.setItem(`voter_${planId}`, JSON.stringify({
        name: voterName.trim(),
        phone: voterPhone.trim(),
        timestamp: Date.now()
      }));
    }
  };

  // Check if already authenticated or if user is the creator
  useEffect(() => {
    // Skip authentication for demo
    if (planId === 'demo') {
      setIsAuthenticated(true);
      setShowLogin(false);
      return;
    }
    
    const voterInfo = localStorage.getItem(`voter_${planId}`);
    const creatorInfo = localStorage.getItem(`creator_${planId}`);
    
    // Check if user came from the create page (has referrer info)
    const cameFromCreate = sessionStorage.getItem('cameFromCreate');
    
    if (voterInfo) {
      // User has already voted in this plan
      const voter = JSON.parse(voterInfo);
      setVoterName(voter.name);
      setVoterPhone(voter.phone);
      setIsAuthenticated(true);
      setShowLogin(false);
    } else if (creatorInfo && cameFromCreate) {
      // User is the creator AND came from create page
      const creator = JSON.parse(creatorInfo);
      setVoterName(creator.name);
      setVoterPhone(creator.phone);
      setIsAuthenticated(true);
      setShowLogin(false);
      // Also store as voter for consistency
      localStorage.setItem(`voter_${planId}`, JSON.stringify({
        name: creator.name,
        phone: creator.phone,
        timestamp: Date.now(),
        isCreator: true
      }));
      // Clear the session flag
      sessionStorage.removeItem('cameFromCreate');
    } else {
      // New user or direct link access - show login form
      // For group plans (3+ people), always require authentication
      if (groupSize && groupSize !== 'solo' && groupSize !== 'date') {
        setShowLogin(true);
        setIsAuthenticated(false);
      } else {
        // For solo/date plans, allow skipping if they have creator info
        if (creatorInfo) {
          const creator = JSON.parse(creatorInfo);
          setVoterName(creator.name);
          setVoterPhone(creator.phone);
          setIsAuthenticated(true);
          setShowLogin(false);
          // Store as voter for consistency
          localStorage.setItem(`voter_${planId}`, JSON.stringify({
            name: creator.name,
            phone: creator.phone,
            timestamp: Date.now(),
            isCreator: true
          }));
        } else {
          setShowLogin(true);
          setIsAuthenticated(false);
        }
      }
    }
  }, [planId, groupSize]);

  // Loading state
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  // Login form
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Join the Vote!</h1>
            <p className="text-gray-600 mb-6">
              Enter your info to start voting on events
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-2">Plan Details:</p>
              <p className="font-semibold text-gray-900">
                {(Array.isArray(topic) ? topic[0] : topic) === 'datenight' ? 'Date Night' : (Array.isArray(topic) ? topic[0] : topic)} • {(Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' ? 'Solo' : (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'date' ? 'Date or Friend Night' : 'Group'}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={voterPhone}
                onChange={(e) => {
                  // Only allow numbers, spaces, dashes, and parentheses
                  const value = e.target.value.replace(/[^0-9\s\-\(\)]/g, '');
                  setVoterPhone(value);
                }}
                placeholder="e.g., (555) 123-4567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mt-6"
            >
              🎯 Start Voting
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>💡 Your vote will be anonymous to other participants</p>
            <p>⏰ Voting session lasts 15 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Demo banner */}
      {planId === 'demo' && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg">
            <span className="text-lg">🎮</span>
            <span className="font-semibold">Demo Mode - Create a real plan to unlock full features!</span>
          </div>
        </div>
      )}

      {/* Header with timer and voter progress */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vote on Events</h1>
        <p className="text-gray-600 mb-4">
          {(Array.isArray(topic) ? topic[0] : topic) === 'datenight' ? 'Date Night' : (Array.isArray(topic) ? topic[0] : topic)} • {(Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' ? 'Solo' : (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'date' ? 'Date or Friend Night' : 'Group'} • {Array.isArray(zip) ? zip[0] : zip}
        </p>
        
        {/* Voter progress counter */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
          <span className="text-lg">👥</span>
          <span className="font-semibold">{completedVoters}/{expectedVoters} finished voting</span>
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
          <span className="text-lg">⏰</span>
          <span className="font-mono font-bold">{formatTime(timeLeft)} left</span>
        </div>
      </div>

      {/* Swipeable event cards */}
      <div className="relative w-full max-w-sm h-[500px]">
        <AnimatePresence>
          {currentIndex < events.length && (
            <motion.div
              key={events[currentIndex].id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.3 }}
              className="absolute w-full"
            >
              <TinderCard
                onSwipe={(dir) => swiped(dir, events[currentIndex].id)}
                preventSwipe={['up', 'down']}
              >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  {/* Event image with hours overlay */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500">
                    <img 
                      src={events[currentIndex].image} 
                      alt={events[currentIndex].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                      {events[currentIndex].isDemo ? 'Demo Hours' : events[currentIndex].hours}
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{events[currentIndex].name}</h2>
                    
                    {/* Star rating */}
                    <div className="flex items-center gap-2 mb-4">
                      {events[currentIndex].isDemo ? (
                        <span className="text-gray-400 text-sm">⭐ Demo Reviews</span>
                      ) : (
                        <>
                          <span className="text-yellow-400">{renderStars(events[currentIndex].reviews.stars)}</span>
                          <span className="text-sm text-gray-600">({events[currentIndex].reviews.count} reviews)</span>
                        </>
                      )}
                    </div>

                    {/* Contact information */}
                    <div className="space-y-2 mb-4">
                      {events[currentIndex].isDemo ? (
                        <div className="text-center py-4">
                          <div className="text-gray-400 text-sm mb-2">🔒 Demo Mode</div>
                          <div className="text-xs text-gray-500">Create a real plan to see contact info</div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-4 h-4">📞</span>
                            <span>{events[currentIndex].contact.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-4 h-4">✉️</span>
                            <span>{events[currentIndex].contact.email}</span>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              </TinderCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion state */}
        {currentIndex >= events.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              {planId === 'demo' ? (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Demo Complete!</h3>
                  <p className="text-gray-600 mb-4">You've seen how Choosy works. Ready to create a real plan?</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/create')}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                    >
                      Create Real Plan
                    </button>
                    <button
                      onClick={() => {
                        const winningEvent = getWinningEvent();
                        const params = new URLSearchParams({
                          topic: Array.isArray(topic) ? topic[0] : topic || '',
                          groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize || '',
                          zip: Array.isArray(zip) ? zip[0] : zip || '',
                          winningEvent: winningEvent ? JSON.stringify(winningEvent) : ''
                        });
                        window.location.href = `/results/${planId}?${params.toString()}`;
                      }}
                      className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200"
                    >
                      See Demo Results
                    </button>
                  </div>
                </>
              ) : allVotersCompleted ? (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 All Votes In!</h3>
                  <p className="text-gray-600 mb-4">Everyone has finished voting. Check the results!</p>
                  <button
                    onClick={() => {
                      const winningEvent = getWinningEvent();
                      const params = new URLSearchParams({
                        topic: Array.isArray(topic) ? topic[0] : topic || '',
                        groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize || '',
                        zip: Array.isArray(zip) ? zip[0] : zip || '',
                        winningEvent: winningEvent ? JSON.stringify(winningEvent) : ''
                      });
                      window.location.href = `/results/${planId}?${params.toString()}`;
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    See Results
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 You're Done!</h3>
                  <p className="text-gray-600 mb-4">Thanks for voting! Waiting for others to finish...</p>
                  <div className="text-sm text-gray-500">
                    <p>{completedVoters}/{expectedVoters} people have finished voting</p>
                    <p className="mt-2">Results will be available when everyone is done!</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Manual control buttons */}
      {currentIndex < events.length && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {/* Manual swipe buttons */}
          <button
            onClick={() => handleManualSwipe('left')}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white text-3xl font-bold rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
          >
            ✕
          </button>
          <button
            onClick={() => handleManualSwipe('right')}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white text-3xl font-bold rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
          >
            ✓
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Swipe right to vote ✅ or left to skip ❌</p>
        <p className="mt-1">Or use the buttons below!</p>
      </div>
    </div>
  );
} 