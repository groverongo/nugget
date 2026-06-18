import io
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

import seaborn as sns

sns.set_theme(style="dark", context="talk")


def grafico_evolucion(
    matches: list[str],
    cumulative_points: list[int],
    title: str,
    return_bytes: bool = False,
):
    if not matches:
        raise ValueError("matches cannot be empty")

    bg_blue = "#0052FF"
    crown_yellow = "#FFD700"
    text_white = "#FFFFFF"
    accent_blue = "#94C7FF"

    fig, ax = plt.subplots(figsize=(max(10, len(matches) * 0.9 + 2), 7))

    fig.patch.set_facecolor(bg_blue)
    ax.set_facecolor(bg_blue)

    ax.plot(
        matches,
        cumulative_points,
        color=crown_yellow,
        linewidth=2.5,
        marker="o",
        markersize=8,
        markerfacecolor=text_white,
        markeredgecolor=crown_yellow,
        markeredgewidth=2,
        zorder=3,
    )

    ax.fill_between(
        range(len(matches)),
        cumulative_points,
        alpha=0.15,
        color=accent_blue,
    )

    for i, pts in enumerate(cumulative_points):
        ax.annotate(
            str(pts),
            (i, pts),
            textcoords="offset points",
            xytext=(0, 10),
            ha="center",
            fontsize=11,
            color=text_white,
            fontweight="bold",
        )

    ax.set_xticks(range(len(matches)))
    ax.set_xticklabels(matches, rotation=45, ha="right", color=text_white, fontsize=11)
    ax.tick_params(axis="y", colors=text_white, labelsize=12)
    ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))

    ax.set_xlabel("Partido", color=text_white, fontweight="bold", labelpad=10)
    ax.set_ylabel("Puntos acumulados", color=text_white, fontweight="bold", labelpad=10)
    ax.set_title(title, color=text_white, fontsize=16, fontweight="bold", pad=15)

    ax.grid(axis="y", color=text_white, alpha=0.15, linestyle="--")

    for spine in ax.spines.values():
        spine.set_color(text_white)
        spine.set_alpha(0.4)

    plt.tight_layout()

    if return_bytes:
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100, facecolor=fig.get_facecolor(), edgecolor="none")
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()
    else:
        plt.show()
