
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";
import { useProducts } from "../../hooks/useProducts";
import {
  Bot,
  X,
  Send,
  Sparkles,
  MessageCircle,
  ShoppingBag,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import "./NovaAssistant.css";

function NovaAssistant() {
  const { products } = useProducts();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey there! 👋 I'm Nova, your personal shopping assistant. Looking for something special today? I'm here to help!",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const getRecommendedProducts = (content) => {
    if (!content || !products.length) return [];

    return products.filter((product) =>
      content.toLowerCase().includes(product.name.toLowerCase())
    );
  };

  const sendMessage = async (text = message) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || loading) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: trimmedMessage },
    ];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "novacart-ai",
        {
          body: {
            messages: updatedMessages
              .filter(
                (msg) =>
                  msg.role === "user" || msg.role === "assistant"
              )
              .map(({ role, content }) => ({ role, content })),
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Nova AI error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops! I'm having trouble connecting right now. Please try again in a moment. ❤️",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What do you recommend?",
    "Show me affordable products",
    "Help me choose a gift",
  ];

  return (
    <div className="nova-assistant">
      {isOpen && (
        <div className="nova-chat-window">
          <div className="nova-chat-header">
            <div className="nova-header-info">
              <div className="nova-avatar">
                <Bot size={22} />
              </div>

              <div>
                <h3>Nova</h3>
                <span>
                  <span className="nova-online-dot"></span>
                  Your AI shopping assistant
                </span>
              </div>
            </div>

            <button
              className="nova-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={21} />
            </button>
          </div>

          <div className="nova-chat-body">
            <div className="nova-welcome">
              <Sparkles size={17} />
              <span>Shopping made easier with AI</span>
            </div>

            {messages.map((msg, index) => {
              const recommendedProducts =
                msg.role === "assistant"
                  ? getRecommendedProducts(msg.content)
                  : [];

              return (
                <div key={index}>
                  <div className={`nova-message ${msg.role}`}>
                    {msg.role === "assistant" && (
                      <div className="nova-message-avatar">
                        <Bot size={16} />
                      </div>
                    )}

                    <div className="nova-message-content">
                      {msg.content}
                    </div>
                  </div>

                  {recommendedProducts.length > 0 && (
                    <div className="nova-product-recommendations">
                      {recommendedProducts.map((product) => (
                        <Link
                          to={`/products/${product.id}`}
                          className="nova-product-card"
                          key={product.id}
                          onClick={() => setIsOpen(false)}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                          />

                          <div className="nova-product-info">
                            <h4>{product.name}</h4>

                            <div className="nova-product-price">
                              <span>
                                ${Number(product.price).toFixed(2)}
                              </span>

                              {product.oldPrice && (
                                <del>
                                  ${Number(product.oldPrice).toFixed(2)}
                                </del>
                              )}
                            </div>

                            <span className="nova-product-link">
                              View product
                              <ArrowUpRight size={14} />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {messages.length === 1 && (
              <div className="nova-suggestions">
                <p>Try asking me:</p>

                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                  >
                    <ShoppingBag size={14} />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="nova-message assistant">
                <div className="nova-message-avatar">
                  <Bot size={16} />
                </div>

                <div className="nova-typing">
                  <LoaderCircle
                    size={16}
                    className="nova-spinner"
                  />
                  Nova is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="nova-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Nova anything..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        className={`nova-toggle ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={
          isOpen ? "Close Nova assistant" : "Open Nova assistant"
        }
      >
        {isOpen ? (
          <X size={25} />
        ) : (
          <MessageCircle size={25} />
        )}
      </button>
    </div>
  );
}

export default NovaAssistant;
