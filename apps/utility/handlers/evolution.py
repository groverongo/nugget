import io
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

import seaborn as sns

sns.set_theme(style="dark", context="talk")


def grafico_evolucion(
    matches: list[dict],
    title: str,
    return_bytes: bool = False,
):
    """
    matches: list of {name: str, accumulated_points: int, date: str (YYYY-MM-DD)}
    """
    if not matches:
        raise ValueError("matches cannot be empty")

    bg_blue = "#0052FF"
    crown_yellow = "#FFD700"
    text_white = "#FFFFFF"
    accent_blue = "#94C7FF"
    separator_color = "#FFFFFF"

    names = [m["name"] for m in matches]
    cumulative_points = [m["accumulated_points"] for m in matches]
    dates = [m["date"] for m in matches]

    fig, ax = plt.subplots(figsize=(max(10, len(matches) * 0.9 + 2), 7))

    fig.patch.set_facecolor(bg_blue)
    ax.set_facecolor(bg_blue)

    ax.plot(
        names,
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
        range(len(names)),
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

    # Add vertical separator lines between different dates
    for i in range(1, len(dates)):
        if dates[i] != dates[i - 1]:
            ax.axvline(
                x=i - 0.5,
                color=separator_color,
                alpha=0.3,
                linewidth=1,
                linestyle="--",
            )
            ax.text(
                i - 0.5,
                ax.get_ylim()[0] if ax.get_ylim()[0] != 0 else min(cumulative_points) * 0.9,
                dates[i],
                color=text_white,
                fontsize=8,
                alpha=0.7,
                ha="center",
                va="bottom",
                rotation=90,
            )

    ax.set_xticks(range(len(names)))
    ax.set_xticklabels(names, rotation=45, ha="right", color=text_white, fontsize=11)
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
