"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Review {
  id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  is_owner: boolean;
}

interface RatingSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

interface ProductReviewsProps {
  productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  const fetchReviews = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/products/${productId}/reviews/`);
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchRatingSummary = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/products/${productId}/rating-summary/`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching rating summary:", error);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
    fetchRatingSummary();
  }, [fetchReviews, fetchRatingSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to leave a review");
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/products/${productId}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        setFormData({ rating: 5, title: "", comment: "" });
        setShowForm(false);
        fetchReviews();
        fetchRatingSummary();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    if (!user) {
      toast.error("Please login to mark reviews as helpful");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/reviews/${reviewId}/helpful/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews((prevReviews: Review[]) =>
          prevReviews.map((review: Review) =>
            review.id === reviewId 
              ? { ...review, helpful_count: data.count }
              : review
          )
        );
      }
    } catch (error) {
      console.error("Error marking helpful:", error);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/reviews/${reviewId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Review deleted");
        fetchReviews();
        fetchRatingSummary();
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const StarRating = ({ rating, onSelect }: { rating: number; onSelect?: (r: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onSelect?.(star)}
          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${onSelect ? 'cursor-pointer hover:scale-110 transition' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  if (loading) {
    return <div className="animate-pulse">Loading reviews...</div>;
  }

  return (
    <div className="mt-8">
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>

        {/* Rating Summary */}
        {summary && summary.total_reviews > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{summary.average_rating}</div>
                <StarRating rating={Math.round(summary.average_rating)} />
                <div className="text-sm text-gray-500">{summary.total_reviews} reviews</div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.rating_distribution[star] || 0;
                  const percentage = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{star}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-12 text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Write Review Button */}
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Write a Review
          </button>
        )}

        {/* Review Form */}
        {showForm && (
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-3">Write Your Review</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <StarRating rating={formData.rating} onSelect={(r) => setFormData({...formData, rating: r})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Review Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Review</label>
                <textarea
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Verified Purchase</span>
                      )}
                    </div>
                    <StarRating rating={review.rating} />
                    <h4 className="font-semibold mt-1">{review.title}</h4>
                    <p className="text-gray-600 mt-1">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleHelpful(review.id)}
                        className="hover:text-orange-600 transition"
                      >
                        👍 Helpful ({review.helpful_count})
                      </button>
                      {review.is_owner && (
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}