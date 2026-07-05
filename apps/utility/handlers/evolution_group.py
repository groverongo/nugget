import io
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

import seaborn as sns

sns.set_theme(style="dark", context="talk")

BG_BLUE = "#0052FF"
TEXT_WHITE = "#FFFFFF"

LINE_COLORS = [
    "#FFD700", "#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181",
    "#FCE38A", "#EAFFD0", "#95E1D3", "#FF8B94", "#A8E6CF",
    "#DCEDC1", "#FFD3B6", "#FFAAA5",
]


def grafico_evolucion_grupal(
    users: list[dict],
    title: str,
    return_bytes: bool = False,
):
    """
    users: list of {
        username: str,
        series: list of {name: str, accumulated_points: int, date: str}
    }
    Shows one line per user with labels.
    """
    if not users:
        raise ValueError("users cannot be empty")

    all_match_names: list[str] = []
    for u in users:
        for s in u["series"]:
            if s["name"] not in all_match_names:
                all_match_names.append(s["name"])

    n_matches = len(all_match_names)
    match_index = {name: i for i, name in enumerate(all_match_names)}

    fig_width = max(12, n_matches * 0.9 + 4)
    fig, ax = plt.subplots(figsize=(fig_width, 8))

    fig.patch.set_facecolor(BG_BLUE)
    ax.set_facecolor(BG_BLUE)

    for idx, user in enumerate(users):
        color = LINE_COLORS[idx % len(LINE_COLORS)]
        series = user["series"]
        if not series:
            continue

        xs = [match_index[s["name"]] for s in series if s["name"] in match_index]
        ys = [s["accumulated_points"] for s in series if s["name"] in match_index]

        ax.plot(
            xs,
            ys,
            color=color,
            linewidth=2,
            marker="o",
            markersize=5,
            label=user["username"],
            zorder=3,
        )

        # Label at the final point
        if xs and ys:
            ax.annotate(
                user["username"],
                (xs[-1], ys[-1]),
                textcoords="offset points",
                xytext=(6, 0),
                ha="left",
                fontsize=9,
                color=color,
                fontweight="bold",
            )

    ax.set_xticks(range(n_matches))
    ax.set_xticklabels(all_match_names, rotation=45, ha="right", color=TEXT_WHITE, fontsize=9)
    ax.tick_params(axis="y", colors=TEXT_WHITE, labelsize=11)
    ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))

    ax.set_xlabel("Partido", color=TEXT_WHITE, fontweight="bold", labelpad=10)
    ax.set_ylabel("Puntos acumulados", color=TEXT_WHITE, fontweight="bold", labelpad=10)
    ax.set_title(title, color=TEXT_WHITE, fontsize=16, fontweight="bold", pad=15)

    ax.grid(axis="y", color=TEXT_WHITE, alpha=0.1, linestyle="--")

    for spine in ax.spines.values():
        spine.set_color(TEXT_WHITE)
        spine.set_alpha(0.3)

    ax.legend(
        loc="upper left",
        fontsize=9,
        facecolor=BG_BLUE,
        edgecolor=TEXT_WHITE,
        labelcolor=TEXT_WHITE,
        framealpha=0.7,
    )

    plt.tight_layout()

    if return_bytes:
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100, facecolor=fig.get_facecolor(), edgecolor="none")
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()
    else:
        plt.show()
