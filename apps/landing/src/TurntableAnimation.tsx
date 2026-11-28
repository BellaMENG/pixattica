import "./TurntableAnimation.css";

function TurntableAnimation() {
    return (
        <div className="turntable-animation" aria-hidden="true">
            <img
                className="turntable-animation__deck"
                src="/images/at-lp120-top-base.png"
                alt=""
                draggable={false}
            />
            <div className="turntable-animation__record">
                <span className="turntable-animation__label" />
            </div>
            <img
                className="turntable-animation__tonearm"
                src="/images/at-lp120-tonearm.png"
                alt=""
                draggable={false}
            />
        </div>
    );
}

export default TurntableAnimation;
